/**
 * antiFloodRuntime.js
 * Group message flood protection.
 * Tracks messages per sender per group in a 5-second rolling window.
 * When the count exceeds FLOOD_LIMIT, the sender is removed from the group.
 *
 * Settings consumed (bot-level, via getAllSettings / getSetting):
 *   ANTI_FLOOD   — "true"/"false"
 *   FLOOD_LIMIT  — number (default 5), messages per 5 s before kick
 */

const { getSetting } = require('./database/settings');

// Map<groupJid, Map<senderJid, { count: number, ts: number }>>
const floodMap = new Map();

const WINDOW_MS = 5000; // 5-second rolling window

/**
 * Call this once after Gifted socket is created.
 * @param {import('gifted-baileys').WASocket} Gifted
 */
function setupAntiFloodRuntime(Gifted) {
    Gifted.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'append') return;

        for (const msg of messages) {
            try {
                if (!msg?.message || !msg?.key?.remoteJid) continue;

                const jid = msg.key.remoteJid;
                // Only groups
                if (!jid.endsWith('@g.us')) continue;
                // Ignore own messages
                if (msg.key.fromMe) continue;

                const antiFlood = await getSetting('ANTI_FLOOD');
                if (!antiFlood || antiFlood !== 'true') continue;

                const limitRaw   = await getSetting('FLOOD_LIMIT');
                const floodLimit = parseInt(limitRaw || '5', 10);

                const sender = msg.key.participant || msg.participant || '';
                if (!sender) continue;

                const now = Date.now();

                if (!floodMap.has(jid)) floodMap.set(jid, new Map());
                const groupMap = floodMap.get(jid);

                const prev = groupMap.get(sender);
                if (!prev || now - prev.ts > WINDOW_MS) {
                    groupMap.set(sender, { count: 1, ts: now });
                    continue;
                }

                prev.count++;
                if (prev.count >= floodLimit) {
                    groupMap.delete(sender);
                    try {
                        await Gifted.groupParticipantsUpdate(jid, [sender], 'remove');
                        await Gifted.sendMessage(jid, {
                            text: `🌊 @${sender.split('@')[0]} was removed for flooding (${prev.count} msgs in 5s).`,
                            mentions: [sender],
                        });
                    } catch (e) {
                        console.error('[antiFloodRuntime] kick failed:', e.message);
                    }
                }
            } catch (err) {
                console.error('[antiFloodRuntime]', err.message);
            }
        }
    });
}

module.exports = { setupAntiFloodRuntime };
