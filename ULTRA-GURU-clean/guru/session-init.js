/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  ULTRA-GURU — Session Initializer
 *  Works on panels (Katabamp, etc.) AND locally.
 *
 *  Priority order:
 *    1. SESSION_ID already set in environment (panel env vars)
 *    2. .env file with SESSION_ID=GURU~...
 *    3. Auto-creates .env with placeholder, then polls until
 *       the user fills it in — no crash, no manual steps.
 *
 *  Format expected:  GURU~<base64data>
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

'use strict';

const fs       = require('fs-extra');
const path     = require('path');
const readline = require('readline');

const ENV_FILE       = path.join(__dirname, '..', '.env');
const SESSION_PREFIX = 'GURU~';
const POLL_INTERVAL  = 5000;   // ms between .env re-reads when waiting

// ─── Validate format ─────────────────────────────────

function isValidSessionId(id) {
    if (!id || typeof id !== 'string') return false;
    if (!id.startsWith(SESSION_PREFIX)) return false;
    const data = id.slice(SESSION_PREFIX.length);
    if (data.length < 20) return false;
    return /^[A-Za-z0-9+/=_-]+$/.test(data);
}

// ─── Read SESSION_ID from .env (if present) ──────────

function readSessionFromEnvFile() {
    if (!fs.existsSync(ENV_FILE)) return null;
    const content = fs.readFileSync(ENV_FILE, 'utf8');
    const match   = content.match(/^SESSION_ID=(.+)$/m);
    if (!match) return null;
    const id = match[1].trim();
    return isValidSessionId(id) ? id : null;
}

// ─── Write / update SESSION_ID in .env ───────────────

function saveToEnv(sessionId) {
    let content = '';
    if (fs.existsSync(ENV_FILE)) {
        content = fs.readFileSync(ENV_FILE, 'utf8');
        if (/^SESSION_ID=/m.test(content)) {
            content = content.replace(/^SESSION_ID=.*$/m, `SESSION_ID=${sessionId}`);
        } else {
            content = content.trimEnd() + `\nSESSION_ID=${sessionId}\n`;
        }
    } else {
        content = `SESSION_ID=${sessionId}\n`;
    }
    fs.writeFileSync(ENV_FILE, content, 'utf8');
    console.log('[Session] ✅ SESSION_ID saved to .env');
}

// ─── Auto-create .env with placeholder ───────────────

function createEnvPlaceholder() {
    if (fs.existsSync(ENV_FILE)) return;  // already exists, don't overwrite

    const placeholder = [
        '# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '#  ULTRA-GURU — Environment Variables',
        '#',
        '#  HOW TO USE:',
        '#    1. Paste your SESSION_ID after the = sign below',
        '#       (it should start with GURU~)',
        '#    2. Save this file',
        '#    3. The bot will detect it automatically — no restart needed!',
        '#',
        '#  SESSION_ID format:  GURU~<base64data>',
        '#  Get yours from the pairing / session generator page.',
        '# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        'SESSION_ID=GURU~',
        '',
        '# Optional settings (leave blank to use bot defaults)',
        'MODE=',
        'TIME_ZONE=',
        'AUTO_READ_STATUS=',
        'AUTO_LIKE_STATUS=',
        'DATABASE_URL=',
    ].join('\n') + '\n';

    fs.writeFileSync(ENV_FILE, placeholder, 'utf8');
    console.log('[Session] 📄 .env file created — paste your SESSION_ID inside it.');
}

// ─── Poll .env until a valid SESSION_ID appears ───────

function waitForEnvFile() {
    return new Promise((resolve) => {
        console.log('\n╔══════════════════════════════════════════════════════╗');
        console.log('║         ULTRA-GURU — Waiting for SESSION_ID          ║');
        console.log('╠══════════════════════════════════════════════════════╣');
        console.log('║                                                      ║');
        console.log('║  A .env file has been created in the bot folder.     ║');
        console.log('║                                                      ║');
        console.log('║  Open it and paste your SESSION_ID after the = sign: ║');
        console.log('║    SESSION_ID=GURU~<your_session_data>               ║');
        console.log('║                                                      ║');
        console.log('║  The bot will start automatically once it detects    ║');
        console.log('║  a valid SESSION_ID — no restart required!           ║');
        console.log('╚══════════════════════════════════════════════════════╝\n');

        let dots = 0;
        const interval = setInterval(() => {
            const id = readSessionFromEnvFile();
            if (id) {
                clearInterval(interval);
                process.stdout.write('\n');
                console.log('[Session] ✅ Valid SESSION_ID detected in .env — starting bot!');
                resolve(id);
                return;
            }
            dots = (dots + 1) % 4;
            process.stdout.write(`\r[Session] ⏳ Waiting for SESSION_ID in .env${''.padEnd(dots, '.')}   `);
        }, POLL_INTERVAL);
    });
}

// ─── Interactive prompt (TTY only) ───────────────────

function promptForSessionId() {
    return new Promise((resolve, reject) => {
        if (!process.stdin.isTTY) {
            return reject(new Error('NO_TTY'));
        }

        const rl = readline.createInterface({
            input:  process.stdin,
            output: process.stdout,
        });

        console.log('\n╔══════════════════════════════════════════════╗');
        console.log('║         ULTRA-GURU — Session Setup           ║');
        console.log('╚══════════════════════════════════════════════╝');
        console.log('');
        console.log('No SESSION_ID found. You can:');
        console.log('');
        console.log('  A — Paste it here now');
        console.log('  B — Fill in the .env file that was just created');
        console.log('      (SESSION_ID=GURU~<your_session_data>)');
        console.log('');
        console.log('📌 Format: GURU~<base64data>');
        console.log('');

        const ask = () => {
            rl.question('➤ Paste your SESSION_ID (or press Enter to wait for .env): ', (answer) => {
                const id = answer.trim();
                if (id === '') {
                    rl.close();
                    return resolve(null);   // signal: fall through to polling
                }
                if (!isValidSessionId(id)) {
                    console.log('\n❌ Invalid format. Must start with "GURU~" followed by your session data.\n');
                    ask();
                    return;
                }
                rl.close();
                resolve(id);
            });
        };

        ask();
    });
}

// ─── Main export ──────────────────────────────────────

/**
 * Call this BEFORE starting the bot.
 * Returns the verified SESSION_ID string.
 * Never throws — waits until a valid session is found.
 */
async function initSession() {
    // 1. Already set in environment (panel env vars take priority)
    let sessionId = process.env.SESSION_ID;

    if (sessionId && isValidSessionId(sessionId)) {
        console.log('[Session] ✅ SESSION_ID loaded from environment.');
        return sessionId;
    }

    if (sessionId && !isValidSessionId(sessionId)) {
        console.warn('[Session] ⚠️  SESSION_ID found in environment but format is invalid.');
        console.warn('           Expected: GURU~<base64data>');
        console.warn('           Got:      ' + sessionId.slice(0, 30) + '...');
    }

    // 2. Try reading .env file
    const idFromFile = readSessionFromEnvFile();
    if (idFromFile) {
        process.env.SESSION_ID = idFromFile;
        console.log('[Session] ✅ SESSION_ID loaded from .env file.');
        return idFromFile;
    }

    // 3. Auto-create .env placeholder so the user has something to fill in
    createEnvPlaceholder();

    // 4a. If we have a terminal, let the user paste it directly OR choose to fill .env
    if (process.stdin.isTTY) {
        try {
            const idFromPrompt = await promptForSessionId();
            if (idFromPrompt) {
                saveToEnv(idFromPrompt);
                process.env.SESSION_ID = idFromPrompt;
                console.log('[Session] ✅ SESSION_ID accepted and saved.');
                return idFromPrompt;
            }
            // null → user pressed Enter → fall through to polling
        } catch (_) {
            // Shouldn't happen since we checked isTTY, but fall through
        }
    }

    // 4b. Poll the .env file until the user fills it in
    //     This path is taken on panels (no TTY) AND when the user chose .env
    const idFromPolling = await waitForEnvFile();
    process.env.SESSION_ID = idFromPolling;
    saveToEnv(idFromPolling);
    return idFromPolling;
}

module.exports = { initSession, isValidSessionId };
