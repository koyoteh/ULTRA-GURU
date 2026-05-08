
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  OWNER CHANNELS — Auto-followed & Auto-reacted
//  To ADD a channel   → push its JID to this array
//  To REMOVE a channel → delete its line from this array
//  Format: '1234567890123456789@newsletter'
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const OWNER_CHANNELS = [
    '120363406649804510@newsletter',   // ← your main channel
    // '0029VbCl2UX3rZZilMSvxN1e@newsletter',  // example — uncomment to add
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  PROFESSOR EMOJIS — randomly picked for every react
//  Add / remove emojis freely below
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const PROFESSOR_EMOJIS = ['🎖️', '✨', '🔥', '💯', '⚡', '🎓', '👑', '🌟', '💎', '🚀'];

// ─── helpers ────────────────────────────────────────

async function safeNewsletterFollow(Gifted, jid) {
    if (!jid || !jid.endsWith('@newsletter')) return false;
    try {
        await Gifted.newsletterFollow(jid);
        console.log(`[AutoFollow] ✅ Followed channel: ${jid}`);
        return true;
    } catch (e) {
        console.log(`[AutoFollow] ⚠️  Could not follow ${jid}: ${e.message}`);
        return false;
    }
}

async function safeGroupAcceptInvite(Gifted, code) {
    if (!code) return false;
    try {
        await Gifted.groupAcceptInvite(code);
        return true;
    } catch (e) {
        return false;
    }
}

// ─── auto-react to ALL posts from tracked channels ───

function setupNewsletterAutoReact(Gifted) {
    Gifted.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg?.message || !msg?.key?.remoteJid) return;

        const jid = msg.key.remoteJid;
        if (!jid.endsWith('@newsletter')) return;

        // Merge built-in + dynamically added channels
        let trackedChannels = [...OWNER_CHANNELS];
        try {
            const { getSetting } = require('../database/settings');
            const extra = await getSetting('OWNER_CHANNELS');
            if (extra) {
                const extraList = extra
                    .split(',')
                    .map(j => j.trim())
                    .filter(j => j.endsWith('@newsletter'));
                trackedChannels = [...new Set([...trackedChannels, ...extraList])];
            }
        } catch (_) {}

        if (!trackedChannels.includes(jid)) return;

        try {
            const emoji = PROFESSOR_EMOJIS[Math.floor(Math.random() * PROFESSOR_EMOJIS.length)];
            const serverId = msg.key.server_id?.toString?.() ?? msg.key.id;
            await Gifted.newsletterReactMessage(jid, serverId, emoji);
            console.log(`[AutoReact] ✅ Reacted ${emoji} to post in ${jid}`);
        } catch (_) {}
    });
}

// ─── auto-follow all channels on connect ─────────────

async function autoFollowAllChannels(Gifted) {
    let trackedChannels = [...OWNER_CHANNELS];
    try {
        const { getSetting } = require('../database/settings');
        const extra = await getSetting('OWNER_CHANNELS');
        if (extra) {
            const extraList = extra
                .split(',')
                .map(j => j.trim())
                .filter(j => j.endsWith('@newsletter'));
            trackedChannels = [...new Set([...trackedChannels, ...extraList])];
        }
    } catch (_) {}

    for (const jid of trackedChannels) {
        await safeNewsletterFollow(Gifted, jid);
    }
}

// ─── main connection handler ─────────────────────────

async function setupConnectionHandler(Gifted, sessionDir, restartFn, options = {}) {
    const ev = Gifted.ev;
    if (!ev) return;

    ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && options.onQR) options.onQR(qr);

        if (connection === 'close') {
            const { DisconnectReason } = require('gifted-baileys');
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

            console.log('[Connection] Closed. Status:', statusCode, '| Reconnect:', shouldReconnect);

            if (options.onClose) {
                try { await options.onClose(lastDisconnect); } catch (_) {}
            }

            if (shouldReconnect) {
                setTimeout(() => {
                    try { restartFn(); } catch (e) {
                        console.error('[Reconnect error]', e.message);
                    }
                }, 3000);
            }
        }

        if (connection === 'open') {
            console.log('✅ WhatsApp Connected!');

            // Auto-follow all tracked channels immediately on connect
            try {
                await autoFollowAllChannels(Gifted);
            } catch (e) {
                console.error('[AutoFollow] Error on connect:', e.message);
            }

            if (options.onOpen) {
                try { await options.onOpen(Gifted); } catch (_) {}
            }
        }
    });

    ev.on('creds.update', async () => {
        try {
            if (Gifted._saveCreds) await Gifted._saveCreds();
        } catch (_) {}
    });

    // Begin listening for newsletter posts to auto-react
    setupNewsletterAutoReact(Gifted);
}

// ─── group event helpers (unchanged) ─────────────────

async function setupGroupEventsListeners(Gifted) {
    const ev = Gifted.ev;
    if (!ev) return;

    ev.on('groups.update', async (updates) => {
        const { updateGroupCache } = require('./groupCache');
        for (const update of updates) {
            if (update.id) {
                try {
                    const meta = await Gifted.groupMetadata(update.id).catch(() => null);
                    if (meta) updateGroupCache(update.id, meta);
                } catch (_) {}
            }
        }
    });

    ev.on('group-participants.update', async ({ id }) => {
        if (!id) return;
        const { updateGroupCache } = require('./groupCache');
        try {
            const meta = await Gifted.groupMetadata(id).catch(() => null);
            if (meta) updateGroupCache(id, meta);
        } catch (_) {}
    });

    try {
        const { setupVvTracker } = require('../vvTracker');
        setupVvTracker(Gifted);
    } catch (e) {
        console.error('[VvTracker] setup error:', e.message);
    }

    // ── settings4 runtime hooks ──────────────────────────────────────────────
    try {
        const { setupAntiCallRuntime } = require('../antiCallRuntime');
        setupAntiCallRuntime(Gifted);
    } catch (e) {
        console.error('[antiCallRuntime] setup error:', e.message);
    }

    try {
        const { setupAntiFloodRuntime } = require('../antiFloodRuntime');
        setupAntiFloodRuntime(Gifted);
    } catch (e) {
        console.error('[antiFloodRuntime] setup error:', e.message);
    }

    try {
        const { setupGroupOnlyRuntime } = require('../groupOnlyRuntime');
        const { getSudoNumbers } = require('../gmdHelpers');
        setupGroupOnlyRuntime(Gifted, getSudoNumbers);
    } catch (e) {
        console.error('[groupOnlyRuntime] setup error:', e.message);
    }
    // ────────────────────────────────────────────────────────────────────────
}

module.exports = {
    OWNER_CHANNELS,
    PROFESSOR_EMOJIS,
    safeNewsletterFollow,
    safeGroupAcceptInvite,
    setupConnectionHandler,
    setupGroupEventsListeners,
    autoFollowAllChannels,
};
