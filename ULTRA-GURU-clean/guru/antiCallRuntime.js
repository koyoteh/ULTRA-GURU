/**
 * antiCallRuntime.js
 * Handles call rejection logic using ANTICALL, ANTICALL_MSG, and ANTICALL_ACTION settings.
 * Hooked into Gifted.ev.on('call') from the main startGifted flow via setupAntiCallRuntime().
 *
 * Settings consumed:
 *   ANTICALL        — "true"/"false"  master switch
 *   ANTICALL_ACTION — "reject" | "warn" | "block"
 *   ANTICALL_MSG    — custom rejection message text
 */

const { getSetting } = require('./database/settings');

/**
 * Call this once after Gifted socket is created.
 * @param {import('gifted-baileys').WASocket} Gifted
 */
function setupAntiCallRuntime(Gifted) {
    Gifted.ev.on('call', async (calls) => {
        for (const call of calls) {
            try {
                // Only handle incoming offer calls
                if (call.status !== 'offer') continue;

                const anticallEnabled = await getSetting('ANTICALL');
                if (!anticallEnabled || anticallEnabled === 'false') continue;

                const action   = (await getSetting('ANTICALL_ACTION')) || 'reject';
                const msg      = (await getSetting('ANTICALL_MSG'))    || '📵 Calls are not allowed.';
                const callerJid = call.from;

                // 1. Always reject the call
                try {
                    await Gifted.rejectCall(call.id, callerJid);
                } catch (_) {}

                // 2. Perform the configured action
                if (action === 'warn') {
                    // Send the rejection message to the caller
                    try {
                        await Gifted.sendMessage(callerJid, { text: msg });
                    } catch (_) {}
                } else if (action === 'block') {
                    // Block the caller
                    try {
                        await Gifted.updateBlockStatus(callerJid, 'block');
                    } catch (_) {}
                }
                // action === 'reject' → already rejected above, no extra step needed

            } catch (err) {
                console.error('[antiCallRuntime]', err.message);
            }
        }
    });
}

module.exports = { setupAntiCallRuntime };
