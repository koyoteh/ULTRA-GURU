/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  Channel Manager Commands
 *
 *  .channels          — list all tracked channels
 *  .addchannel <jid>  — add + follow a channel
 *  .removechannel <jid> — remove a custom channel
 *  .followchannels    — manually re-follow all
 *  .professoremojis   — list react emojis
 *
 *  Built-in (hardcoded) channels are in:
 *    guru/connection/connectionHandler.js → OWNER_CHANNELS[]
 *
 *  Custom channels are stored in the DB and persist
 *  across restarts.
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const { gmd } = require('../guru');
const { getSetting, setSetting } = require('../guru/database/settings');
const {
    safeNewsletterFollow,
    autoFollowAllChannels,
    OWNER_CHANNELS,
    PROFESSOR_EMOJIS,
} = require('../guru/connection/connectionHandler');

// ─── .channels ───────────────────────────────────────

gmd(
    {
        pattern: 'channels',
        aliases: ['mychannel', 'mychannels', 'channelinfo', 'chinfo'],
        react: '📡',
        category: 'owner',
        description: 'View all auto-followed channels and their react status',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isSuperUser, botFooter } = conText;
        if (!isSuperUser) {
            await react('❌');
            return reply('❌ Owner Only Command!');
        }

        try {
            const extra = await getSetting('OWNER_CHANNELS');
            const customChannels = extra
                ? extra.split(',').map(j => j.trim()).filter(j => j.endsWith('@newsletter'))
                : [];
            const allChannels = [...new Set([...OWNER_CHANNELS, ...customChannels])];

            let msg =
                `📡 *CHANNEL MANAGER*\n` +
                `${'─'.repeat(30)}\n\n` +
                `🟢 *Auto-React:*  ALWAYS ON\n` +
                `🎭 *React Style:* Random Professor Emojis\n` +
                `🔁 *Auto-Follow:* On every connect\n` +
                `📊 *Total:* ${allChannels.length} channel(s)\n\n` +
                `*📌 TRACKED CHANNELS:*\n`;

            allChannels.forEach((jid, i) => {
                const isBuiltIn = OWNER_CHANNELS.includes(jid);
                msg += `\n${i + 1}. \`${jid}\`\n`;
                msg += `   ${isBuiltIn ? '🔒 Built-in (hardcoded)' : '➕ Custom (from DB)'}\n`;
            });

            msg +=
                `\n${'─'.repeat(30)}\n` +
                `📘 *Commands:*\n` +
                `• \`.addchannel <jid>\` — add channel\n` +
                `• \`.removechannel <jid>\` — remove custom channel\n` +
                `• \`.followchannels\` — re-follow all now\n\n` +
                `> _${botFooter}_`;

            await react('✅');
            await reply(msg);
        } catch (err) {
            await react('❌');
            await reply(`❌ Error: ${err.message}`);
        }
    }
);

// ─── .addchannel ─────────────────────────────────────

gmd(
    {
        pattern: 'addchannel',
        aliases: ['setchannel', 'trackchannel'],
        react: '➕',
        category: 'owner',
        description: 'Add a channel to auto-follow and auto-react list',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isSuperUser, q, botFooter } = conText;
        if (!isSuperUser) {
            await react('❌');
            return reply('❌ Owner Only Command!');
        }

        if (!q) {
            return reply(
                '❌ Provide a channel JID!\n' +
                'Example: `.addchannel 120363406649804510@newsletter`'
            );
        }

        const jid = q.trim();
        if (!jid.endsWith('@newsletter')) {
            return reply('❌ Invalid JID! Must end with `@newsletter`');
        }

        try {
            const current = await getSetting('OWNER_CHANNELS');
            const existing = current
                ? current.split(',').map(j => j.trim()).filter(Boolean)
                : [];

            if (OWNER_CHANNELS.includes(jid) || existing.includes(jid)) {
                return reply(`⚠️ Channel \`${jid}\` is already tracked!`);
            }

            existing.push(jid);
            await setSetting('OWNER_CHANNELS', existing.join(','));
            await safeNewsletterFollow(Gifted, jid);

            await react('✅');
            await reply(
                `✅ *Channel Added & Followed!*\n\n` +
                `📡 \`${jid}\`\n\n` +
                `✨ Will now auto-follow and auto-react to posts.\n\n` +
                `> _${botFooter}_`
            );
        } catch (err) {
            await react('❌');
            await reply(`❌ Error: ${err.message}`);
        }
    }
);

// ─── .removechannel ──────────────────────────────────

gmd(
    {
        pattern: 'removechannel',
        aliases: ['delchannel', 'untrackchannel'],
        react: '➖',
        category: 'owner',
        description: 'Remove a custom channel from the auto-react list',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isSuperUser, q, botFooter } = conText;
        if (!isSuperUser) {
            await react('❌');
            return reply('❌ Owner Only Command!');
        }

        if (!q) {
            return reply(
                '❌ Provide a channel JID!\n' +
                'Example: `.removechannel 120363406649804510@newsletter`'
            );
        }

        const jid = q.trim();

        if (OWNER_CHANNELS.includes(jid)) {
            return reply(
                `⚠️ \`${jid}\` is a built-in channel and cannot be removed here.\n\n` +
                `To remove it, edit \`guru/connection/connectionHandler.js\` and delete its line from the \`OWNER_CHANNELS\` array.`
            );
        }

        try {
            const current = await getSetting('OWNER_CHANNELS');
            const existing = current
                ? current.split(',').map(j => j.trim()).filter(Boolean)
                : [];

            const idx = existing.indexOf(jid);
            if (idx === -1) {
                return reply(`⚠️ Channel \`${jid}\` is not in the custom list.`);
            }

            existing.splice(idx, 1);
            await setSetting('OWNER_CHANNELS', existing.join(','));

            await react('✅');
            await reply(
                `✅ *Channel Removed!*\n\n` +
                `📡 \`${jid}\` removed from auto-react tracking.\n\n` +
                `> _${botFooter}_`
            );
        } catch (err) {
            await react('❌');
            await reply(`❌ Error: ${err.message}`);
        }
    }
);

// ─── .followchannels ─────────────────────────────────

gmd(
    {
        pattern: 'followchannels',
        aliases: ['rechannels', 'refollowchannels', 'followall'],
        react: '📡',
        category: 'owner',
        description: 'Manually re-follow all tracked channels right now',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isSuperUser, botFooter } = conText;
        if (!isSuperUser) {
            await react('❌');
            return reply('❌ Owner Only Command!');
        }

        try {
            const extra = await getSetting('OWNER_CHANNELS');
            const customChannels = extra
                ? extra.split(',').map(j => j.trim()).filter(j => j.endsWith('@newsletter'))
                : [];
            const allChannels = [...new Set([...OWNER_CHANNELS, ...customChannels])];

            let succeeded = 0;
            let failed = 0;
            for (const jid of allChannels) {
                const ok = await safeNewsletterFollow(Gifted, jid);
                if (ok) succeeded++; else failed++;
            }

            await react('✅');
            await reply(
                `📡 *Channel Follow Complete*\n\n` +
                `✅ Followed: ${succeeded}\n` +
                `❌ Failed:   ${failed}\n` +
                `📊 Total:    ${allChannels.length}\n\n` +
                `> _${botFooter}_`
            );
        } catch (err) {
            await react('❌');
            await reply(`❌ Error: ${err.message}`);
        }
    }
);

// ─── .professoremojis ────────────────────────────────

gmd(
    {
        pattern: 'professoremojis',
        aliases: ['profemojis', 'channelemojis', 'reactemojis'],
        react: '🎓',
        category: 'owner',
        description: 'View all professor emojis used for channel auto-reactions',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isSuperUser, botFooter } = conText;
        if (!isSuperUser) {
            await react('❌');
            return reply('❌ Owner Only Command!');
        }

        await react('✅');
        await reply(
            `🎓 *Professor React Emojis*\n\n` +
            `These emojis are randomly used when auto-reacting to channel posts:\n\n` +
            PROFESSOR_EMOJIS.join('  ') +
            `\n\n📊 *Total:* ${PROFESSOR_EMOJIS.length} emojis\n\n` +
            `> _To add/remove emojis, edit PROFESSOR_EMOJIS in:\n` +
            `> \`guru/connection/connectionHandler.js\`_\n\n` +
            `> _${botFooter}_`
        );
    }
);
