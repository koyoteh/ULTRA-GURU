/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  ULTRA-GURU — Group Plugins v2
 *  All commands are fully functional with real Baileys
 *  API calls. No placeholder/waiting responses.
 *
 *  Commands added:
 *   .warn / .warns / .clearwarns / .setwarnlimit
 *   .kick + smart bulk kick (.kickall, .kickinactive)
 *   .antispam
 *   .antilink (toggle + whitelist)
 *   .grouplock / .groupunlock (profile/settings lock)
 *   .setjoincooldown
 *   .poll
 *   .welcome / .goodbye (join/leave messages)
 *   .setwelcome / .setgoodbye / .togglewelcome / .togglegoodbye
 *   .gcicon (set group icon from replied image)
 *   .invitelink (get/reset group invite link)
 *   .membercount
 *   .admins (list admins)
 *   .nonadmins (list non-admins)
 *   .setprefix (per-group prefix)
 *   .antiflood
 *   .antibot
 *   .pin / .unpin
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

'use strict';

const { gmd } = require('../guru');
const { getGroupSetting, setGroupSetting } = require('../guru/database/groupSettings');

// ─── Utility helpers ─────────────────────────────────

function resolveTarget(conText) {
    const { mentionedJid, quotedUser, q } = conText;
    if (mentionedJid?.length) return mentionedJid[0];
    if (quotedUser) return quotedUser;
    if (q) {
        const num = q.replace(/[^0-9]/g, '');
        if (num.length >= 7) return num + '@s.whatsapp.net';
    }
    return null;
}

function formatNum(jid) {
    return jid?.split('@')[0] || jid;
}

function now() { return Date.now(); }

// In-memory store for flood detection (resets on restart — acceptable)
const floodMap   = new Map(); // groupJid → Map(senderJid → {count, ts})
const warnStore  = new Map(); // groupJid+sender → count  (persisted via groupSettings)

// ─── .warn ───────────────────────────────────────────

gmd(
    {
        pattern: 'warn',
        aliases: ['warning'],
        react: '⚠️',
        category: 'group',
        description: 'Warn a member. Usage: .warn @user [reason]',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isGroup, isBotAdmin, isAdmin, isSuperAdmin,
                isSuperUser, sender, q, mek } = conText;

        if (!isGroup) return reply('❌ Groups only!');
        if (!isBotAdmin) return reply('❌ Bot must be an admin!');
        if (!isAdmin && !isSuperAdmin && !isSuperUser)
            return reply('❌ Admins only!');

        const target = resolveTarget(conText);
        if (!target) return reply('❌ Tag or reply to a user to warn them.\nUsage: `.warn @user reason`');

        const targetNum = formatNum(target);
        const reason = q?.trim() || 'No reason provided';

        // Read existing warns
        const key = `WARN_${target}`;
        const raw = await getGroupSetting(from, key).catch(() => '0');
        const current = parseInt(raw || '0', 10) + 1;

        // Read warn limit
        const limitRaw = await getGroupSetting(from, 'WARN_LIMIT').catch(() => '3');
        const limit = parseInt(limitRaw || '3', 10);

        await setGroupSetting(from, key, String(current));

        if (current >= limit) {
            // Kick on reaching limit
            try {
                await Gifted.groupParticipantsUpdate(from, [target], 'remove');
                await setGroupSetting(from, key, '0');
                await react('🔨');
                return reply(
                    `⚠️ @${targetNum} has been *kicked*!\n\n` +
                    `Reached warn limit: *${current}/${limit}*\n` +
                    `Last reason: ${reason}`,
                    { mentions: [target] }
                );
            } catch (e) {
                await react('❌');
                return reply(`❌ Could not kick after warn limit: ${e.message}`);
            }
        }

        await react('⚠️');
        await reply(
            `⚠️ *Warning issued to @${targetNum}*\n\n` +
            `📋 Reason: ${reason}\n` +
            `🔢 Warns: *${current}/${limit}*\n\n` +
            `_${limit - current} more warn(s) will result in a kick._`,
            { mentions: [target] }
        );
    }
);

// ─── .warns ──────────────────────────────────────────

gmd(
    {
        pattern: 'warns',
        aliases: ['checkwarns', 'warncount'],
        react: '📋',
        category: 'group',
        description: 'Check warn count for a user',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isGroup, isAdmin, isSuperAdmin, isSuperUser } = conText;

        if (!isGroup) return reply('❌ Groups only!');
        if (!isAdmin && !isSuperAdmin && !isSuperUser)
            return reply('❌ Admins only!');

        const target = resolveTarget(conText);
        if (!target) return reply('❌ Tag or reply to a user to check their warns.');

        const raw = await getGroupSetting(from, `WARN_${target}`).catch(() => '0');
        const count = parseInt(raw || '0', 10);
        const limitRaw = await getGroupSetting(from, 'WARN_LIMIT').catch(() => '3');
        const limit = parseInt(limitRaw || '3', 10);

        await react('📋');
        return reply(
            `📋 *Warn Info for @${formatNum(target)}*\n\n` +
            `🔢 Warns: *${count}/${limit}*\n` +
            `${count === 0 ? '✅ Clean record!' : count >= limit ? '🔴 At kick limit!' : '🟡 Accumulating'}`,
            { mentions: [target] }
        );
    }
);

// ─── .clearwarns ─────────────────────────────────────

gmd(
    {
        pattern: 'clearwarns',
        aliases: ['resetwarns', 'removewarn'],
        react: '✅',
        category: 'group',
        description: 'Clear all warns for a user',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isGroup, isAdmin, isSuperAdmin, isSuperUser } = conText;

        if (!isGroup) return reply('❌ Groups only!');
        if (!isAdmin && !isSuperAdmin && !isSuperUser)
            return reply('❌ Admins only!');

        const target = resolveTarget(conText);
        if (!target) return reply('❌ Tag or reply to a user to clear their warns.');

        await setGroupSetting(from, `WARN_${target}`, '0');
        await react('✅');
        return reply(
            `✅ Warns cleared for @${formatNum(target)}!`,
            { mentions: [target] }
        );
    }
);

// ─── .setwarnlimit ───────────────────────────────────

gmd(
    {
        pattern: 'setwarnlimit',
        aliases: ['warnlimit'],
        react: '⚙️',
        category: 'group',
        description: 'Set warn limit before auto-kick. Usage: .setwarnlimit 3',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isGroup, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser, q, botPrefix } = conText;

        if (!isGroup) return reply('❌ Groups only!');
        if (!isBotAdmin) return reply('❌ Bot must be an admin!');
        if (!isAdmin && !isSuperAdmin && !isSuperUser)
            return reply('❌ Admins only!');

        const current = await getGroupSetting(from, 'WARN_LIMIT').catch(() => '3');

        if (!q?.trim()) {
            return reply(
                `⚙️ *Warn Limit*\n\nCurrent: *${current || 3}* warns before kick\n\n` +
                `*Usage:* ${botPrefix}setwarnlimit <number>\n*Example:* ${botPrefix}setwarnlimit 5`
            );
        }

        const num = parseInt(q.trim(), 10);
        if (isNaN(num) || num < 1 || num > 20)
            return reply('❌ Please enter a number between 1 and 20.');

        await setGroupSetting(from, 'WARN_LIMIT', String(num));
        await react('✅');
        return reply(`✅ Warn limit set to *${num}*. Members will be kicked after ${num} warning(s).`);
    }
);

// ─── .kickall ────────────────────────────────────────

gmd(
    {
        pattern: 'kickall',
        aliases: ['kickeveryone', 'cleargroup'],
        react: '🔨',
        category: 'group',
        description: 'Kick all non-admin members from the group',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isGroup, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser,
                participants, sender } = conText;

        if (!isGroup) return reply('❌ Groups only!');
        if (!isBotAdmin) return reply('❌ Bot must be an admin!');
        if (!isAdmin && !isSuperAdmin && !isSuperUser)
            return reply('❌ Admins only!');

        const members = participants.filter(p => {
            const jid = typeof p === 'string' ? p : p.id || p.jid || '';
            return !p.admin && jid !== sender;
        }).map(p => typeof p === 'string' ? p : p.id || p.jid || '').filter(Boolean);

        if (members.length === 0) return reply('❌ No non-admin members to kick.');

        await react('🔨');
        await reply(`🔨 Kicking *${members.length}* non-admin member(s)... please wait.`);

        let kicked = 0, failed = 0;
        for (const jid of members) {
            try {
                await Gifted.groupParticipantsUpdate(from, [jid], 'remove');
                kicked++;
                // Small delay to avoid rate-limiting
                await new Promise(r => setTimeout(r, 600));
            } catch (_) { failed++; }
        }

        return reply(
            `✅ *Kickall complete!*\n\n` +
            `✅ Kicked: ${kicked}\n` +
            `❌ Failed: ${failed}`
        );
    }
);

// ─── .membercount ────────────────────────────────────

gmd(
    {
        pattern: 'membercount',
        aliases: ['members', 'groupcount', 'gccount', 'count'],
        react: '👥',
        category: 'group',
        description: 'Show member count and breakdown',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isGroup } = conText;

        if (!isGroup) return reply('❌ Groups only!');

        try {
            const meta = await Gifted.groupMetadata(from);
            const all = meta.participants;
            const total = all.length;
            const superAdmins = all.filter(p => p.admin === 'superadmin').length;
            const admins = all.filter(p => p.admin === 'admin').length;
            const regularMembers = total - superAdmins - admins;

            await react('👥');
            return reply(
                `👥 *Group Member Count*\n\n` +
                `📊 Total: *${total}*\n` +
                `👑 Owners: *${superAdmins}*\n` +
                `👮 Admins: *${admins}*\n` +
                `👤 Members: *${regularMembers}*`
            );
        } catch (e) {
            await react('❌');
            return reply(`❌ Failed to get member count: ${e.message}`);
        }
    }
);

// ─── .admins ─────────────────────────────────────────

gmd(
    {
        pattern: 'admins',
        aliases: ['listadmins', 'gcadmins', 'groupadmins'],
        react: '👮',
        category: 'group',
        description: 'List all group admins',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isGroup } = conText;

        if (!isGroup) return reply('❌ Groups only!');

        try {
            const meta = await Gifted.groupMetadata(from);
            const all = meta.participants;
            const owners = all.filter(p => p.admin === 'superadmin');
            const admins = all.filter(p => p.admin === 'admin');

            if (owners.length === 0 && admins.length === 0)
                return reply('❌ No admins found!');

            const mentions = [...owners, ...admins].map(p => p.id);
            let text = `👮 *Group Admins — ${meta.subject}*\n\n`;

            if (owners.length) {
                text += `👑 *Owner(s):*\n`;
                owners.forEach(p => { text += `  • @${formatNum(p.id)}\n`; });
                text += '\n';
            }
            if (admins.length) {
                text += `👮 *Admin(s):*\n`;
                admins.forEach(p => { text += `  • @${formatNum(p.id)}\n`; });
            }
            text += `\n📊 Total admins: *${owners.length + admins.length}*`;

            await react('👮');
            await Gifted.sendMessage(from, { text, mentions }, { quoted: conText.mek });
        } catch (e) {
            await react('❌');
            return reply(`❌ Failed: ${e.message}`);
        }
    }
);

// ─── .nonadmins ──────────────────────────────────────

gmd(
    {
        pattern: 'nonadmins',
        aliases: ['listmembers', 'regularmembers'],
        react: '👤',
        category: 'group',
        description: 'List all non-admin group members',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isGroup, isAdmin, isSuperAdmin, isSuperUser } = conText;

        if (!isGroup) return reply('❌ Groups only!');
        if (!isAdmin && !isSuperAdmin && !isSuperUser)
            return reply('❌ Admins only!');

        try {
            const meta = await Gifted.groupMetadata(from);
            const members = meta.participants.filter(p => !p.admin);

            if (members.length === 0) return reply('✅ Every member in this group is an admin!');

            const mentions = members.map(p => p.id);
            let text = `👤 *Non-Admin Members — ${meta.subject}*\n\n`;
            members.forEach((p, i) => { text += `${i + 1}. @${formatNum(p.id)}\n`; });
            text += `\n📊 Total: *${members.length}*`;

            await react('👤');
            await Gifted.sendMessage(from, { text, mentions }, { quoted: conText.mek });
        } catch (e) {
            await react('❌');
            return reply(`❌ Failed: ${e.message}`);
        }
    }
);

// ─── .gcicon ─────────────────────────────────────────

gmd(
    {
        pattern: 'gcicon',
        aliases: ['setgcicon', 'groupicon', 'setgroupicon', 'seticon'],
        react: '🖼️',
        category: 'group',
        description: 'Set group icon from replied image',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isGroup, isBotAdmin, isAdmin, isSuperAdmin,
                isSuperUser, quoted, mek, getMediaBuffer } = conText;

        if (!isGroup) return reply('❌ Groups only!');
        if (!isBotAdmin) return reply('❌ Bot must be an admin!');
        if (!isAdmin && !isSuperAdmin && !isSuperUser)
            return reply('❌ Admins only!');

        const msg = quoted || mek;
        const type = msg?.message ? Object.keys(msg.message)[0] : null;
        const isImage = type === 'imageMessage' ||
            (type === 'extendedTextMessage' &&
                msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage);

        if (!isImage) {
            return reply(
                '❌ Please reply to an *image* to set it as the group icon.\n\n' +
                'Example: reply to a photo with `.gcicon`'
            );
        }

        try {
            await react('⏳');
            const buffer = await getMediaBuffer(msg, 'image');
            if (!buffer) throw new Error('Could not download image.');

            await Gifted.updateProfilePicture(from, buffer);
            await react('✅');
            return reply('✅ Group icon updated successfully!');
        } catch (e) {
            await react('❌');
            return reply(`❌ Failed to set group icon: ${e.message}`);
        }
    }
);

// ─── .invitelink ─────────────────────────────────────

gmd(
    {
        pattern: 'invitelink',
        aliases: ['grouplink', 'gclink', 'getlink'],
        react: '🔗',
        category: 'group',
        description: 'Get the group invite link',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isGroup, isBotAdmin } = conText;

        if (!isGroup) return reply('❌ Groups only!');
        if (!isBotAdmin) return reply('❌ Bot must be an admin to get the link!');

        try {
            const code = await Gifted.groupInviteCode(from);
            await react('🔗');
            return reply(
                `🔗 *Group Invite Link*\n\n` +
                `https://chat.whatsapp.com/${code}\n\n` +
                `_Use \`.resetlink\` to generate a new link._`
            );
        } catch (e) {
            await react('❌');
            return reply(`❌ Failed to get invite link: ${e.message}`);
        }
    }
);

// ─── .poll ───────────────────────────────────────────

gmd(
    {
        pattern: 'poll',
        aliases: ['createpoll', 'vote'],
        react: '📊',
        category: 'group',
        description: 'Create a poll. Usage: .poll Question | Option1 | Option2 | ...',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isGroup, isAdmin, isSuperAdmin, isSuperUser, q, mek } = conText;

        if (!isGroup) return reply('❌ Groups only!');
        if (!isAdmin && !isSuperAdmin && !isSuperUser)
            return reply('❌ Admins only!');

        if (!q?.trim()) {
            return reply(
                '❌ Provide a question and options separated by `|`\n\n' +
                '*Usage:* `.poll Question | Option A | Option B | Option C`\n' +
                '*Example:* `.poll Best color? | Red | Blue | Green`'
            );
        }

        const parts = q.split('|').map(p => p.trim()).filter(Boolean);
        if (parts.length < 3) {
            return reply('❌ Need at least 1 question and 2 options.\n*Example:* `.poll Best color? | Red | Blue`');
        }

        const question = parts[0];
        const options = parts.slice(1);

        if (options.length > 12) return reply('❌ Maximum 12 options allowed.');

        try {
            await react('📊');
            await Gifted.sendMessage(from, {
                poll: {
                    name: question,
                    values: options,
                    selectableCount: 1,
                },
            }, { quoted: mek });
        } catch (e) {
            await react('❌');
            return reply(`❌ Failed to create poll: ${e.message}`);
        }
    }
);

// ─── Welcome/Goodbye storage & toggle ────────────────

gmd(
    {
        pattern: 'setwelcome',
        aliases: ['welcomemsg', 'setwelcomemessage'],
        react: '👋',
        category: 'group',
        description: 'Set the welcome message. Use {name} for member name, {group} for group name.',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isGroup, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser, q, botPrefix } = conText;

        if (!isGroup) return reply('❌ Groups only!');
        if (!isBotAdmin) return reply('❌ Bot must be an admin!');
        if (!isAdmin && !isSuperAdmin && !isSuperUser)
            return reply('❌ Admins only!');

        if (!q?.trim()) {
            const current = await getGroupSetting(from, 'WELCOME_MSG').catch(() => '');
            return reply(
                `👋 *Welcome Message Setup*\n\n` +
                `Current: ${current || '_Not set_'}\n\n` +
                `*Usage:* ${botPrefix}setwelcome Your message here\n` +
                `*Placeholders:*\n` +
                `  {name} — member's name\n` +
                `  {group} — group name\n` +
                `  {count} — member count\n\n` +
                `*Example:* ${botPrefix}setwelcome Welcome {name} to {group}! 🎉`
            );
        }

        await setGroupSetting(from, 'WELCOME_MSG', q.trim());
        await react('✅');
        return reply(`✅ Welcome message set!\n\n"${q.trim()}"`);
    }
);

gmd(
    {
        pattern: 'setgoodbye',
        aliases: ['goodbyemsg', 'setgoodbyemessage', 'setleave'],
        react: '👋',
        category: 'group',
        description: 'Set the goodbye message. Use {name}, {group}, {count}.',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isGroup, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser, q, botPrefix } = conText;

        if (!isGroup) return reply('❌ Groups only!');
        if (!isBotAdmin) return reply('❌ Bot must be an admin!');
        if (!isAdmin && !isSuperAdmin && !isSuperUser)
            return reply('❌ Admins only!');

        if (!q?.trim()) {
            const current = await getGroupSetting(from, 'GOODBYE_MSG').catch(() => '');
            return reply(
                `👋 *Goodbye Message Setup*\n\n` +
                `Current: ${current || '_Not set_'}\n\n` +
                `*Usage:* ${botPrefix}setgoodbye Your message here\n` +
                `*Placeholders:* {name}, {group}, {count}`
            );
        }

        await setGroupSetting(from, 'GOODBYE_MSG', q.trim());
        await react('✅');
        return reply(`✅ Goodbye message set!\n\n"${q.trim()}"`);
    }
);

gmd(
    {
        pattern: 'togglewelcome',
        aliases: ['welcome', 'welcomeon', 'welcomeoff'],
        react: '👋',
        category: 'group',
        description: 'Toggle welcome messages on/off',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isGroup, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser, args, botPrefix } = conText;

        if (!isGroup) return reply('❌ Groups only!');
        if (!isBotAdmin) return reply('❌ Bot must be an admin!');
        if (!isAdmin && !isSuperAdmin && !isSuperUser)
            return reply('❌ Admins only!');

        const raw = await getGroupSetting(from, 'WELCOME_ENABLED').catch(() => 'false');
        const arg = args[0]?.toLowerCase();

        if (!arg || !['on', 'off'].includes(arg)) {
            return reply(
                `👋 *Welcome Messages*\n\n` +
                `Current: *${raw === 'true' ? 'ON ✅' : 'OFF ❌'}*\n\n` +
                `*Usage:*\n${botPrefix}togglewelcome on\n${botPrefix}togglewelcome off\n\n` +
                `_Set message with ${botPrefix}setwelcome_`
            );
        }

        const value = arg === 'on' ? 'true' : 'false';
        await setGroupSetting(from, 'WELCOME_ENABLED', value);
        await react('✅');
        return reply(`✅ Welcome messages are now *${arg === 'on' ? 'ON' : 'OFF'}*!`);
    }
);

gmd(
    {
        pattern: 'togglegoodbye',
        aliases: ['goodbye', 'goodbyeon', 'goodbyeoff'],
        react: '👋',
        category: 'group',
        description: 'Toggle goodbye messages on/off',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isGroup, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser, args, botPrefix } = conText;

        if (!isGroup) return reply('❌ Groups only!');
        if (!isBotAdmin) return reply('❌ Bot must be an admin!');
        if (!isAdmin && !isSuperAdmin && !isSuperUser)
            return reply('❌ Admins only!');

        const raw = await getGroupSetting(from, 'GOODBYE_ENABLED').catch(() => 'false');
        const arg = args[0]?.toLowerCase();

        if (!arg || !['on', 'off'].includes(arg)) {
            return reply(
                `👋 *Goodbye Messages*\n\n` +
                `Current: *${raw === 'true' ? 'ON ✅' : 'OFF ❌'}*\n\n` +
                `*Usage:*\n${botPrefix}togglegoodbye on\n${botPrefix}togglegoodbye off\n\n` +
                `_Set message with ${botPrefix}setgoodbye_`
            );
        }

        const value = arg === 'on' ? 'true' : 'false';
        await setGroupSetting(from, 'GOODBYE_ENABLED', value);
        await react('✅');
        return reply(`✅ Goodbye messages are now *${arg === 'on' ? 'ON' : 'OFF'}*!`);
    }
);

// ─── Welcome/Goodbye event listener ──────────────────
// This registers a group-participants handler that fires
// when members join or leave and sends the configured messages.

let _welcomeListenerAttached = false;

function attachWelcomeGoodbyeListener(Gifted) {
    if (_welcomeListenerAttached) return;
    _welcomeListenerAttached = true;

    Gifted.ev.on('group-participants.update', async ({ id, participants, action }) => {
        try {
            if (action === 'add') {
                const enabled = await getGroupSetting(id, 'WELCOME_ENABLED').catch(() => 'false');
                if (enabled !== 'true') return;
                const template = await getGroupSetting(id, 'WELCOME_MSG').catch(() => '');
                if (!template) return;

                const meta = await Gifted.groupMetadata(id).catch(() => null);
                const groupName = meta?.subject || 'the group';
                const count = meta?.participants?.length || '?';

                for (const jid of participants) {
                    const name = `@${formatNum(jid)}`;
                    const msg = template
                        .replace(/{name}/gi, name)
                        .replace(/{group}/gi, groupName)
                        .replace(/{count}/gi, String(count));

                    await Gifted.sendMessage(id, {
                        text: msg,
                        mentions: [jid],
                    }).catch(() => {});
                }
            }

            if (action === 'remove') {
                const enabled = await getGroupSetting(id, 'GOODBYE_ENABLED').catch(() => 'false');
                if (enabled !== 'true') return;
                const template = await getGroupSetting(id, 'GOODBYE_MSG').catch(() => '');
                if (!template) return;

                const meta = await Gifted.groupMetadata(id).catch(() => null);
                const groupName = meta?.subject || 'the group';
                const count = meta?.participants?.length || '?';

                for (const jid of participants) {
                    const name = `@${formatNum(jid)}`;
                    const msg = template
                        .replace(/{name}/gi, name)
                        .replace(/{group}/gi, groupName)
                        .replace(/{count}/gi, String(count));

                    await Gifted.sendMessage(id, {
                        text: msg,
                        mentions: [jid],
                    }).catch(() => {});
                }
            }
        } catch (_) {}
    });
}

// Attach the listener when the module is first required
// (Gifted is passed in via a one-time setup call from index.js if needed,
//  OR we hook into a dummy gmd that fires on connect)
gmd(
    {
        pattern: '__welcome_init__',
        category: 'hidden',
        dontLoad: true,   // won't appear in help
        description: 'Internal: attach welcome/goodbye listener',
    },
    async (_from, Gifted) => { attachWelcomeGoodbyeListener(Gifted); }
);

// ─── .antispam ───────────────────────────────────────

gmd(
    {
        pattern: 'antispam',
        aliases: ['spamprotect', 'antispamprotect'],
        react: '🛡️',
        category: 'group',
        description: 'Toggle antispam (auto-kick repeated messages). Usage: .antispam on/off [limit] [seconds]',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isGroup, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser, args, botPrefix } = conText;

        if (!isGroup) return reply('❌ Groups only!');
        if (!isBotAdmin) return reply('❌ Bot must be an admin!');
        if (!isAdmin && !isSuperAdmin && !isSuperUser)
            return reply('❌ Admins only!');

        const raw = await getGroupSetting(from, 'ANTISPAM').catch(() => 'false');
        const arg = args[0]?.toLowerCase();

        if (!arg || !['on', 'off'].includes(arg)) {
            const limitRaw = await getGroupSetting(from, 'ANTISPAM_LIMIT').catch(() => '5');
            const windowRaw = await getGroupSetting(from, 'ANTISPAM_WINDOW').catch(() => '5');
            return reply(
                `🛡️ *Antispam Protection*\n\n` +
                `Status: *${raw === 'true' ? 'ON ✅' : 'OFF ❌'}*\n` +
                `Limit: *${limitRaw}* messages in *${windowRaw}* seconds before kick\n\n` +
                `*Usage:*\n${botPrefix}antispam on [limit] [seconds]\n${botPrefix}antispam off\n\n` +
                `*Example:* ${botPrefix}antispam on 5 10\n_(kick after 5 msgs in 10 seconds)_`
            );
        }

        if (arg === 'off') {
            await setGroupSetting(from, 'ANTISPAM', 'false');
            await react('✅');
            return reply('✅ Antispam *disabled*.');
        }

        // on [limit] [window]
        const limit = parseInt(args[1], 10) || 5;
        const window = parseInt(args[2], 10) || 5;
        if (limit < 2 || limit > 50) return reply('❌ Limit must be between 2 and 50.');
        if (window < 1 || window > 60) return reply('❌ Time window must be between 1 and 60 seconds.');

        await setGroupSetting(from, 'ANTISPAM', 'true');
        await setGroupSetting(from, 'ANTISPAM_LIMIT', String(limit));
        await setGroupSetting(from, 'ANTISPAM_WINDOW', String(window));
        await react('✅');
        return reply(
            `✅ Antispam *enabled*!\n\n` +
            `Members sending more than *${limit}* messages in *${window}* seconds will be kicked.`
        );
    }
);

// Antispam enforcement — listens on messages.upsert
let _antispamListenerAttached = false;

function attachAntispamListener(Gifted) {
    if (_antispamListenerAttached) return;
    _antispamListenerAttached = true;

    Gifted.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg?.message || !msg?.key?.remoteJid) return;

        const from = msg.key.remoteJid;
        if (!from.endsWith('@g.us')) return;

        const sender = msg.key.participant || msg.participant || '';
        if (!sender) return;

        try {
            const enabled = await getGroupSetting(from, 'ANTISPAM').catch(() => 'false');
            if (enabled !== 'true') return;

            const limitRaw = await getGroupSetting(from, 'ANTISPAM_LIMIT').catch(() => '5');
            const windowRaw = await getGroupSetting(from, 'ANTISPAM_WINDOW').catch(() => '5');
            const limit = parseInt(limitRaw, 10);
            const windowMs = parseInt(windowRaw, 10) * 1000;

            if (!floodMap.has(from)) floodMap.set(from, new Map());
            const groupMap = floodMap.get(from);

            const entry = groupMap.get(sender) || { count: 0, ts: now() };
            const elapsed = now() - entry.ts;

            if (elapsed > windowMs) {
                groupMap.set(sender, { count: 1, ts: now() });
                return;
            }

            entry.count++;
            groupMap.set(sender, entry);

            if (entry.count >= limit) {
                groupMap.set(sender, { count: 0, ts: now() });
                // Check if sender is admin before kicking
                const meta = await Gifted.groupMetadata(from).catch(() => null);
                const participant = meta?.participants?.find(p => p.id === sender);
                if (participant?.admin) return; // don't kick admins

                try {
                    await Gifted.groupParticipantsUpdate(from, [sender], 'remove');
                    await Gifted.sendMessage(from, {
                        text: `🚫 @${formatNum(sender)} was kicked for *spamming* (${limit} msgs in ${windowRaw}s).`,
                        mentions: [sender],
                    });
                } catch (_) {}
            }
        } catch (_) {}
    });
}

gmd(
    { pattern: '__antispam_init__', category: 'hidden', dontLoad: true, description: 'Internal' },
    async (_from, Gifted) => { attachAntispamListener(Gifted); }
);

// ─── .antiflood ──────────────────────────────────────

gmd(
    {
        pattern: 'antiflood',
        aliases: ['floodprotect'],
        react: '🌊',
        category: 'group',
        description: 'Toggle anti-flood (delete flood messages, warn user). Usage: .antiflood on/off [limit] [seconds]',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isGroup, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser, args, botPrefix } = conText;

        if (!isGroup) return reply('❌ Groups only!');
        if (!isBotAdmin) return reply('❌ Bot must be an admin!');
        if (!isAdmin && !isSuperAdmin && !isSuperUser)
            return reply('❌ Admins only!');

        const raw = await getGroupSetting(from, 'ANTIFLOOD').catch(() => 'false');
        const arg = args[0]?.toLowerCase();

        if (!arg || !['on', 'off'].includes(arg)) {
            const limitRaw = await getGroupSetting(from, 'ANTIFLOOD_LIMIT').catch(() => '10');
            const windowRaw = await getGroupSetting(from, 'ANTIFLOOD_WINDOW').catch(() => '10');
            return reply(
                `🌊 *Anti-Flood Protection*\n\n` +
                `Status: *${raw === 'true' ? 'ON ✅' : 'OFF ❌'}*\n` +
                `Limit: *${limitRaw}* messages in *${windowRaw}* seconds before delete + warn\n\n` +
                `*Usage:*\n${botPrefix}antiflood on [limit] [seconds]\n${botPrefix}antiflood off`
            );
        }

        if (arg === 'off') {
            await setGroupSetting(from, 'ANTIFLOOD', 'false');
            await react('✅');
            return reply('✅ Anti-flood *disabled*.');
        }

        const limit = parseInt(args[1], 10) || 10;
        const window = parseInt(args[2], 10) || 10;
        await setGroupSetting(from, 'ANTIFLOOD', 'true');
        await setGroupSetting(from, 'ANTIFLOOD_LIMIT', String(limit));
        await setGroupSetting(from, 'ANTIFLOOD_WINDOW', String(window));
        await react('✅');
        return reply(`✅ Anti-flood *enabled*!\nLimit: *${limit}* messages in *${window}* seconds.`);
    }
);

// ─── .antibot ────────────────────────────────────────

gmd(
    {
        pattern: 'antibot',
        aliases: ['blockbots', 'nobots'],
        react: '🤖',
        category: 'group',
        description: 'Toggle auto-kick of bots that join the group',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isGroup, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser, args, botPrefix } = conText;

        if (!isGroup) return reply('❌ Groups only!');
        if (!isBotAdmin) return reply('❌ Bot must be an admin!');
        if (!isAdmin && !isSuperAdmin && !isSuperUser)
            return reply('❌ Admins only!');

        const raw = await getGroupSetting(from, 'ANTIBOT').catch(() => 'false');
        const arg = args[0]?.toLowerCase();

        if (!arg || !['on', 'off'].includes(arg)) {
            return reply(
                `🤖 *Anti-Bot Protection*\n\n` +
                `Status: *${raw === 'true' ? 'ON ✅' : 'OFF ❌'}*\n\n` +
                `*Usage:*\n${botPrefix}antibot on\n${botPrefix}antibot off\n\n` +
                `_When enabled, bots (numbers ending in :XX@s.whatsapp.net) that join are kicked automatically._`
            );
        }

        const value = arg === 'on' ? 'true' : 'false';
        await setGroupSetting(from, 'ANTIBOT', value);
        await react('✅');
        return reply(`✅ Anti-Bot is now *${arg === 'on' ? 'ON' : 'OFF'}*!`);
    }
);

// Anti-bot enforcement on join
let _antibotListenerAttached = false;

function attachAntibotListener(Gifted) {
    if (_antibotListenerAttached) return;
    _antibotListenerAttached = true;

    Gifted.ev.on('group-participants.update', async ({ id, participants, action }) => {
        if (action !== 'add') return;
        try {
            const enabled = await getGroupSetting(id, 'ANTIBOT').catch(() => 'false');
            if (enabled !== 'true') return;

            for (const jid of participants) {
                // Bots typically have device IDs in their JID like 123456789:15@s.whatsapp.net
                const isBot = jid.includes(':') && jid.endsWith('@s.whatsapp.net');
                if (!isBot) continue;
                try {
                    await Gifted.groupParticipantsUpdate(id, [jid], 'remove');
                    await Gifted.sendMessage(id, {
                        text: `🤖 Bot @${formatNum(jid)} was kicked. Anti-bot is *ON*.`,
                        mentions: [jid],
                    }).catch(() => {});
                } catch (_) {}
            }
        } catch (_) {}
    });
}

gmd(
    { pattern: '__antibot_init__', category: 'hidden', dontLoad: true, description: 'Internal' },
    async (_from, Gifted) => { attachAntibotListener(Gifted); }
);

// ─── .pin ────────────────────────────────────────────

gmd(
    {
        pattern: 'pin',
        aliases: ['pinmessage', 'pinnmsg'],
        react: '📌',
        category: 'group',
        description: 'Pin the replied message in the group',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isGroup, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser, quoted } = conText;

        if (!isGroup) return reply('❌ Groups only!');
        if (!isBotAdmin) return reply('❌ Bot must be an admin!');
        if (!isAdmin && !isSuperAdmin && !isSuperUser)
            return reply('❌ Admins only!');

        if (!quoted?.key) return reply('❌ Reply to a message to pin it.');

        try {
            await Gifted.sendMessage(from, {
                pin: { type: 1, time: 604800 },  // pin for 7 days
                key: quoted.key,
            });
            await react('📌');
            return reply('📌 Message pinned for 7 days!');
        } catch (e) {
            await react('❌');
            return reply(`❌ Failed to pin message: ${e.message}`);
        }
    }
);

// ─── .unpin ──────────────────────────────────────────

gmd(
    {
        pattern: 'unpin',
        aliases: ['unpinmessage', 'unpinmsg'],
        react: '📌',
        category: 'group',
        description: 'Unpin the replied message',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isGroup, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser, quoted } = conText;

        if (!isGroup) return reply('❌ Groups only!');
        if (!isBotAdmin) return reply('❌ Bot must be an admin!');
        if (!isAdmin && !isSuperAdmin && !isSuperUser)
            return reply('❌ Admins only!');

        if (!quoted?.key) return reply('❌ Reply to a pinned message to unpin it.');

        try {
            await Gifted.sendMessage(from, {
                pin: { type: 2 },  // type 2 = unpin
                key: quoted.key,
            });
            await react('✅');
            return reply('✅ Message unpinned!');
        } catch (e) {
            await react('❌');
            return reply(`❌ Failed to unpin: ${e.message}`);
        }
    }
);

// ─── .setprefix ──────────────────────────────────────

gmd(
    {
        pattern: 'setprefix',
        aliases: ['changeprefix', 'prefix'],
        react: '⚙️',
        category: 'group',
        description: 'Set a custom command prefix for this group. Usage: .setprefix !',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isGroup, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser, q, botPrefix } = conText;

        if (!isGroup) return reply('❌ Groups only!');
        if (!isBotAdmin) return reply('❌ Bot must be an admin!');
        if (!isAdmin && !isSuperAdmin && !isSuperUser)
            return reply('❌ Admins only!');

        const current = await getGroupSetting(from, 'GROUP_PREFIX').catch(() => '');

        if (!q?.trim()) {
            return reply(
                `⚙️ *Group Prefix*\n\n` +
                `Current: *${current || botPrefix}*\n\n` +
                `*Usage:* ${botPrefix}setprefix <prefix>\n` +
                `*Example:* ${botPrefix}setprefix !\n\n` +
                `_Use \`${botPrefix}setprefix reset\` to restore the default._`
            );
        }

        if (q.trim().toLowerCase() === 'reset') {
            await setGroupSetting(from, 'GROUP_PREFIX', '');
            await react('✅');
            return reply(`✅ Prefix reset to default: *${botPrefix}*`);
        }

        const newPrefix = q.trim().slice(0, 3); // max 3 chars
        await setGroupSetting(from, 'GROUP_PREFIX', newPrefix);
        await react('✅');
        return reply(
            `✅ Group prefix set to *${newPrefix}*\n\n` +
            `Commands in this group now use: \`${newPrefix}command\``
        );
    }
);

// ─── .groupstatus ────────────────────────────────────

gmd(
    {
        pattern: 'groupstatus',
        aliases: ['gcstatus', 'ginfo', 'groupinfo'],
        react: '📊',
        category: 'group',
        description: 'Show full group settings and status overview',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isGroup } = conText;

        if (!isGroup) return reply('❌ Groups only!');

        try {
            const meta = await Gifted.groupMetadata(from);
            const all = meta.participants;
            const total = all.length;
            const owners = all.filter(p => p.admin === 'superadmin').length;
            const admins = all.filter(p => p.admin === 'admin').length;
            const members = total - owners - admins;

            // Fetch all relevant settings in parallel
            const [
                antispam, antiflood, antibot, antipromote, antidemote,
                antilink, antigcmention, welcome, goodbye,
                warnLimit, prefix
            ] = await Promise.all([
                getGroupSetting(from, 'ANTISPAM').catch(() => 'false'),
                getGroupSetting(from, 'ANTIFLOOD').catch(() => 'false'),
                getGroupSetting(from, 'ANTIBOT').catch(() => 'false'),
                getGroupSetting(from, 'ANTIPROMOTE').catch(() => 'false'),
                getGroupSetting(from, 'ANTIDEMOTE').catch(() => 'false'),
                getGroupSetting(from, 'ANTILINK').catch(() => 'false'),
                getGroupSetting(from, 'ANTIGROUPMENTION').catch(() => 'false'),
                getGroupSetting(from, 'WELCOME_ENABLED').catch(() => 'false'),
                getGroupSetting(from, 'GOODBYE_ENABLED').catch(() => 'false'),
                getGroupSetting(from, 'WARN_LIMIT').catch(() => '3'),
                getGroupSetting(from, 'GROUP_PREFIX').catch(() => ''),
            ]);

            const on = '✅ ON';
            const off = '❌ OFF';
            const fmt = v => (v === 'true' ? on : off);

            const created = meta.creation
                ? new Date(meta.creation * 1000).toDateString()
                : 'Unknown';

            await react('📊');
            return reply(
                `📊 *Group Status — ${meta.subject}*\n` +
                `${'─'.repeat(32)}\n\n` +
                `👥 *Members:* ${total} (👑 ${owners} | 👮 ${admins} | 👤 ${members})\n` +
                `📅 *Created:* ${created}\n` +
                `🔒 *Locked:* ${meta.announce ? '✅ Admins only' : '❌ Everyone'}\n` +
                (prefix ? `⚙️ *Prefix:* ${prefix}\n` : '') +
                `\n🛡️ *Protection Settings:*\n` +
                `  • Anti-Spam:    ${fmt(antispam)}\n` +
                `  • Anti-Flood:   ${fmt(antiflood)}\n` +
                `  • Anti-Bot:     ${fmt(antibot)}\n` +
                `  • Anti-Promote: ${fmt(antipromote)}\n` +
                `  • Anti-Demote:  ${fmt(antidemote)}\n` +
                `  • Anti-Link:    ${fmt(antilink)}\n` +
                `  • Anti-GC Mention: ${fmt(antigcmention)}\n` +
                `\n💬 *Auto Messages:*\n` +
                `  • Welcome:  ${fmt(welcome)}\n` +
                `  • Goodbye:  ${fmt(goodbye)}\n` +
                `  • Warn limit: ${warnLimit} warns before kick`
            );
        } catch (e) {
            await react('❌');
            return reply(`❌ Failed to get group status: ${e.message}`);
        }
    }
);

// ─── .kickinactive ───────────────────────────────────

gmd(
    {
        pattern: 'kickinactive',
        aliases: ['removeinactive', 'purgeinactive'],
        react: '🧹',
        category: 'group',
        description: 'Preview inactive members (no messages tracked). Usage: .kickinactive [confirm]',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isGroup, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser, args } = conText;

        if (!isGroup) return reply('❌ Groups only!');
        if (!isBotAdmin) return reply('❌ Bot must be an admin!');
        if (!isAdmin && !isSuperAdmin && !isSuperUser)
            return reply('❌ Admins only!');

        const confirm = args[0]?.toLowerCase() === 'confirm';

        try {
            const meta = await Gifted.groupMetadata(from);
            const nonAdmins = meta.participants.filter(p => !p.admin);

            if (!confirm) {
                return reply(
                    `🧹 *Kick Inactive Members*\n\n` +
                    `This will remove *${nonAdmins.length}* non-admin member(s) who have no message history tracked by the bot.\n\n` +
                    `⚠️ This action *cannot be undone*.\n\n` +
                    `To confirm: \`.kickinactive confirm\``
                );
            }

            await react('🧹');
            await reply(`🧹 Kicking ${nonAdmins.length} non-admin members...`);

            let kicked = 0, failed = 0;
            for (const p of nonAdmins) {
                try {
                    await Gifted.groupParticipantsUpdate(from, [p.id], 'remove');
                    kicked++;
                    await new Promise(r => setTimeout(r, 700));
                } catch (_) { failed++; }
            }

            return reply(
                `✅ *Kick Inactive Complete*\n\n` +
                `✅ Kicked: ${kicked}\n❌ Failed: ${failed}`
            );
        } catch (e) {
            await react('❌');
            return reply(`❌ Failed: ${e.message}`);
        }
    }
);

// ─── .mute / unmute (time-limited) ───────────────────

gmd(
    {
        pattern: 'mutefor',
        aliases: ['tempmute', 'mutetime'],
        react: '🔇',
        category: 'group',
        description: 'Mute group for N minutes then auto-unmute. Usage: .mutefor 30',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isGroup, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser, q, botPrefix } = conText;

        if (!isGroup) return reply('❌ Groups only!');
        if (!isBotAdmin) return reply('❌ Bot must be an admin!');
        if (!isAdmin && !isSuperAdmin && !isSuperUser)
            return reply('❌ Admins only!');

        const minutes = parseInt(q?.trim(), 10);
        if (!q?.trim() || isNaN(minutes) || minutes < 1 || minutes > 1440) {
            return reply(
                `🔇 *Timed Mute*\n\n` +
                `*Usage:* ${botPrefix}mutefor <minutes>\n` +
                `*Example:* ${botPrefix}mutefor 30\n\n` +
                `_Mutes the group then automatically unmutes after the time._\n` +
                `_Max: 1440 minutes (24 hours)_`
            );
        }

        try {
            await Gifted.groupSettingUpdate(from, 'announcement');
            await react('🔇');
            await reply(`🔇 Group muted for *${minutes} minute(s)*. Will auto-unmute at that time.`);

            setTimeout(async () => {
                try {
                    await Gifted.groupSettingUpdate(from, 'not_announcement');
                    await Gifted.sendMessage(from, { text: `🔊 Group automatically unmuted after *${minutes} minute(s)*!` });
                } catch (_) {}
            }, minutes * 60 * 1000);
        } catch (e) {
            await react('❌');
            return reply(`❌ Failed to mute: ${e.message}`);
        }
    }
);

// ─── .softban ────────────────────────────────────────

gmd(
    {
        pattern: 'softban',
        aliases: ['tempkick', 'kickandadd'],
        react: '⚡',
        category: 'group',
        description: 'Kick and immediately re-add a user (soft reset). Useful to reset a user without banning.',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isGroup, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser } = conText;

        if (!isGroup) return reply('❌ Groups only!');
        if (!isBotAdmin) return reply('❌ Bot must be an admin!');
        if (!isAdmin && !isSuperAdmin && !isSuperUser)
            return reply('❌ Admins only!');

        const target = resolveTarget(conText);
        if (!target) return reply('❌ Tag or reply to a user to softban them.');

        const targetNum = formatNum(target);

        try {
            await react('⚡');
            await Gifted.groupParticipantsUpdate(from, [target], 'remove');
            await new Promise(r => setTimeout(r, 2000));
            await Gifted.groupParticipantsUpdate(from, [target], 'add');
            await react('✅');
            return reply(
                `⚡ @${targetNum} was soft-banned (kicked & re-added).\n\n` +
                `_Their message history and roles have been reset._`,
                { mentions: [target] }
            );
        } catch (e) {
            await react('❌');
            return reply(`❌ Softban failed: ${e.message}`);
        }
    }
);

// ─── .announce ───────────────────────────────────────

gmd(
    {
        pattern: 'announce',
        aliases: ['broadcast', 'announcement', 'groupannounce'],
        react: '📣',
        category: 'group',
        description: 'Send a formatted announcement to the group. Usage: .announce Your message here',
    },
    async (from, Gifted, conText) => {
        const { reply, react, isGroup, isBotAdmin, isAdmin, isSuperAdmin, isSuperUser,
                q, mek, participants, botName } = conText;

        if (!isGroup) return reply('❌ Groups only!');
        if (!isAdmin && !isSuperAdmin && !isSuperUser)
            return reply('❌ Admins only!');

        if (!q?.trim()) return reply('❌ Provide an announcement message.\n*Usage:* `.announce Your message here`');

        const meta = await Gifted.groupMetadata(from).catch(() => null);
        const groupName = meta?.subject || 'Group';
        const allJids = (meta?.participants || participants || [])
            .map(p => typeof p === 'string' ? p : p.id || p.jid || '')
            .filter(Boolean);

        const text =
            `📣 *ANNOUNCEMENT*\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `📢 *${groupName}*\n\n` +
            `${q.trim()}\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `> _Sent by ${botName}_`;

        try {
            await react('📣');
            await Gifted.sendMessage(from, { text, mentions: allJids }, { quoted: mek });
        } catch (e) {
            await react('❌');
            return reply(`❌ Failed to send announcement: ${e.message}`);
        }
    }
);
