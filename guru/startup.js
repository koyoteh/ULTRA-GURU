/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  ULTRA-GURU — startup.js
 *
 *  This is the new entry point that replaces calling
 *  index.js directly.  It handles SESSION_ID resolution
 *  BEFORE the bot starts, so panels (Katabamp, etc.)
 *  that have no TTY get a clear error with instructions,
 *  and users with a terminal get an interactive prompt.
 *
 *  Start command:  node startup.js
 *  (or update your panel / Procfile to use this)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

'use strict';

const { initSession } = require('./session-init');

(async () => {
    try {
        // Verify / obtain SESSION_ID before anything else loads
        await initSession();

        // Now start the actual bot (index.js reads process.env.SESSION_ID)
        require('../index.js');

    } catch (err) {
        console.error('[Startup] Fatal error:', err.message);
        process.exit(1);
    }
})();
