/**
 * groupOnlyRuntime.js
 * When GROUP_ONLY_COMMANDS is "true", intercepts commands sent in DMs
 * and replies with a notice, unless the sender is a super-user (owner/sudo).
 *
 * Settings consumed:
 *   GROUP_ONLY_COMMANDS — "true"/"false"
 *   PREFIX              — bot command prefix (default ".")
 *   OWNER_NUMBER        — owner JID base
 */

const { getSetting } = require('./database/settings');

/**
 * Call this once after Gifted socket is created.
 * @param {import('gifted-baileys').WASocket} Gifted
 * @param {Function} getSudoNumbers  — async () => string[]
 */
function setupGroupOnlyRuntime(Gifted, getSudoNumbers) {
    Gifted.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'append') return;

        for (const msg of messages) {
            try {
                if (!msg?.message || !msg?.key?.remoteJid) continue;
                if (msg.key.fromMe) continue;

                const jid = msg.key.remoteJid;
                // Only DMs (not groups, not broadcast, not status)
                if (jid.endsWith('@g.us') || jid.endsWith('@broadcast') || jid === 'status@broadcast') continue;

                const groupOnly = await getSetting('GROUP_ONLY_COMMANDS');
                if (!groupOnly || groupOnly !== 'true') continue;

                const prefix    = (await getSetting('PREFIX')) || '.';
                const ownerNum  = (await getSetting('OWNER_NUMBER')) || '';
                const body      = msg.message?.conversation
                    || msg.message?.extendedTextMessage?.text
                    || '';

                if (!body.startsWith(prefix)) continue; // not a command

                const sender     = msg.key.remoteJid;
                const senderNum  = sender.split('@')[0];
                const sudos      = (await getSudoNumbers()) || [];

                // Allow owner and sudo users to bypass
                if (senderNum === ownerNum || sudos.includes(senderNum)) continue;

                await Gifted.sendMessage(jid, {
                    text: '👥 *Group-Only Mode* is active.\n\nCommands only work inside groups.',
                    quoted: msg,
                });
            } catch (err) {
                console.error('[groupOnlyRuntime]', err.message);
            }
        }
    });
}

module.exports = { setupGroupOnlyRuntime };
