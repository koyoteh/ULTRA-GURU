
const { gmd } = require("../guru");
const { getSetting, setSetting, getAllSettings } = require("../guru/database/settings");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const OWNER_ONLY = true;

function onOff(val) {
    const v = String(val || "").trim().toLowerCase();
    if (v === "on") return "true";
    if (v === "off") return "false";
    return null;
}

function displayBool(val) {
    return String(val).toLowerCase() === "true" ? "✅ ON" : "❌ OFF";
}

// ─── 1. SETANTICALLMSG ────────────────────────────────────────────────────────

gmd(
    {
        pattern: "setanticallmsg",
        aliases: ["anticallmsg", "callrejectmsg"],
        react: "📵",
        description: "Set the message sent when a call is rejected — .setanticallmsg Your message here",
        category: "settings",
        ownerOnly: OWNER_ONLY,
    },
    async (from, Gifted, conText) => {
        const { reply, react, q, isSuperUser } = conText;
        if (!isSuperUser) return reply("❌ Owner Only Command!");
        if (!q) return reply("❌ Provide the message text.\nExample: `.setanticallmsg 📵 No calls allowed!`");
        await setSetting("ANTICALL_MSG", q.trim());
        await react("✅");
        reply(`✅ Anti-call message updated to:\n\n_${q.trim()}_`);
    }
);

// ─── 2. SETDMACTION ───────────────────────────────────────────────────────────

gmd(
    {
        pattern: "setdmaction",
        aliases: ["dmpermitaction", "pmaction"],
        react: "💬",
        description: "Set action when a non-permitted DM is received — .setdmaction block/warn/ignore",
        category: "settings",
        ownerOnly: OWNER_ONLY,
    },
    async (from, Gifted, conText) => {
        const { reply, react, q, isSuperUser } = conText;
        if (!isSuperUser) return reply("❌ Owner Only Command!");
        const valid = ["block", "warn", "ignore"];
        const action = (q || "").trim().toLowerCase();
        if (!valid.includes(action))
            return reply(`❌ Usage: \`.setdmaction block\` | \`.setdmaction warn\` | \`.setdmaction ignore\``);
        await setSetting("DM_PERMIT_ACTION", action);
        await react("✅");
        const msgs = {
            block:  "🚫 Non-permitted DMs will be *blocked* automatically.",
            warn:   "⚠️ Non-permitted DMs will receive a *warning* message.",
            ignore: "🔇 Non-permitted DMs will be *silently ignored*.",
        };
        reply(`✅ DM action set.\n\n${msgs[action]}`);
    }
);

// ─── 3. SETDMMSG ──────────────────────────────────────────────────────────────

gmd(
    {
        pattern: "setdmmsg",
        aliases: ["pmpermitmsg", "dmpermitmsg"],
        react: "✉️",
        description: "Set the message sent to non-permitted DM senders — .setdmmsg Your message",
        category: "settings",
        ownerOnly: OWNER_ONLY,
    },
    async (from, Gifted, conText) => {
        const { reply, react, q, isSuperUser } = conText;
        if (!isSuperUser) return reply("❌ Owner Only Command!");
        if (!q) return reply("❌ Provide the DM message text.\nExample: `.setdmmsg Hi! DMs are restricted.`");
        await setSetting("DM_PERMIT_MSG", q.trim()); // shared key with restrictions.js
        await react("✅");
        reply(`✅ DM permit message set to:\n\n_${q.trim()}_`);
    }
);

// ─── 4. SETANTIVIEWONCE ───────────────────────────────────────────────────────

gmd(
    {
        pattern: "setantiviewonce",
        aliases: ["antiviewonce", "antionce"],
        react: "👁️",
        description: "Control view-once message forwarding — .setantiviewonce on/off/indm",
        category: "settings",
        ownerOnly: OWNER_ONLY,
    },
    async (from, Gifted, conText) => {
        const { reply, react, q, isSuperUser } = conText;
        if (!isSuperUser) return reply("❌ Owner Only Command!");
        const valid = ["on", "off", "indm"];
        const val = (q || "").trim().toLowerCase();
        if (!valid.includes(val))
            return reply("❌ Usage: `.setantiviewonce on` | `.setantiviewonce off` | `.setantiviewonce indm`\n\n*on* = forward all view-once\n*off* = disabled\n*indm* = forward only DM view-once");
        const stored = val === "on" ? "true" : val === "off" ? "false" : "indm";
        await setSetting("ANTIVIEWONCE", stored);
        await react("✅");
        const msgs = {
            on:   "👁️ *Anti-ViewOnce* is ON — all view-once media will be forwarded to you.",
            off:  "👁️ *Anti-ViewOnce* is OFF.",
            indm: "👁️ *Anti-ViewOnce* is set to *DMs only* — only DM view-once messages are forwarded.",
        };
        reply(`✅ ${msgs[val]}`);
    }
);

// ─── 5. SETVVTRACKER ─────────────────────────────────────────────────────────

gmd(
    {
        pattern: "setvvtracker",
        aliases: ["vvtracker", "viewtracker"],
        react: "🕵️",
        description: "Track who views view-once messages — .setvvtracker on/off",
        category: "settings",
        ownerOnly: OWNER_ONLY,
    },
    async (from, Gifted, conText) => {
        const { reply, react, q, isSuperUser } = conText;
        if (!isSuperUser) return reply("❌ Owner Only Command!");
        const val = onOff(q);
        if (!val) return reply("❌ Usage: `.setvvtracker on` or `.setvvtracker off`");
        await setSetting("VV_TRACKER", val);
        await react("✅");
        reply(val === "true"
            ? "🕵️ *VV Tracker* is ON. View-once tracking is enabled."
            : "🕵️ *VV Tracker* is OFF.");
    }
);

// ─── 6. SETAUTOJOIN ──────────────────────────────────────────────────────────

gmd(
    {
        pattern: "setautojoin",
        aliases: ["autojoin", "setjoin"],
        react: "🔗",
        description: "Auto-accept group invite links — .setautojoin on/off",
        category: "settings",
        ownerOnly: OWNER_ONLY,
    },
    async (from, Gifted, conText) => {
        const { reply, react, q, isSuperUser } = conText;
        if (!isSuperUser) return reply("❌ Owner Only Command!");
        const val = onOff(q);
        if (!val) return reply("❌ Usage: `.setautojoin on` or `.setautojoin off`");
        await setSetting("AUTO_JOIN", val);
        await react("✅");
        reply(val === "true"
            ? "🔗 *Auto-Join* is ON. Bot will auto-accept group invites sent in DM."
            : "🔗 *Auto-Join* is OFF.");
    }
);

// ─── 7. SETAUTOUPDATE ────────────────────────────────────────────────────────

gmd(
    {
        pattern: "setautoupdate",
        aliases: ["autoupdate", "autoupd"],
        react: "🔄",
        description: "Toggle automatic bot updates — .setautoupdate on/off",
        category: "settings",
        ownerOnly: OWNER_ONLY,
    },
    async (from, Gifted, conText) => {
        const { reply, react, q, isSuperUser } = conText;
        if (!isSuperUser) return reply("❌ Owner Only Command!");
        const val = onOff(q);
        if (!val) return reply("❌ Usage: `.setautoupdate on` or `.setautoupdate off`");
        await setSetting("AUTO_UPDATE", val);
        await react("✅");
        reply(val === "true"
            ? "🔄 *Auto-Update* is ON. Bot will check for and apply updates automatically."
            : "🔄 *Auto-Update* is OFF. Updates must be applied manually.");
    }
);

// ─── 8. SETWARNCOUNT ─────────────────────────────────────────────────────────

gmd(
    {
        pattern: "setwarncount",
        aliases: ["warncount", "warnmax"],
        react: "⚠️",
        description: "Set max warnings before action is taken — .setwarncount 3",
        category: "settings",
        ownerOnly: OWNER_ONLY,
    },
    async (from, Gifted, conText) => {
        const { reply, react, q, isSuperUser } = conText;
        if (!isSuperUser) return reply("❌ Owner Only Command!");
        const num = parseInt(q);
        if (isNaN(num) || num < 1 || num > 20)
            return reply("❌ Please provide a number between 1 and 20.\nExample: `.setwarncount 3`");
        await setSetting("WARN_LIMIT", num.toString()); // shared key with group2.js
        await react("✅");
        reply(`✅ Warn count set to *${num}*. Members will be actioned after ${num} warning(s).`);
    }
);

// ─── 9. SETAUTOREAD ──────────────────────────────────────────────────────────

gmd(
    {
        pattern: "setautoreadmsgs",
        aliases: ["autoreadmsgs", "readmsgs"],
        react: "✉️",
        description: "Auto-read all incoming messages — .setautoreadmsgs on/off/groups/dm",
        category: "settings",
        ownerOnly: OWNER_ONLY,
    },
    async (from, Gifted, conText) => {
        const { reply, react, q, isSuperUser } = conText;
        if (!isSuperUser) return reply("❌ Owner Only Command!");
        const valid = ["on", "off", "groups", "dm"];
        const val = (q || "").trim().toLowerCase();
        if (!valid.includes(val))
            return reply("❌ Usage: `.setautoreadmsgs on` | `.setautoreadmsgs off` | `.setautoreadmsgs groups` | `.setautoreadmsgs dm`");
        const stored = val === "on" ? "true" : val === "off" ? "false" : val;
        await setSetting("AUTO_READ_MESSAGES", stored);
        await react("✅");
        const msgs = {
            on:     "✉️ *Auto-Read Messages* is ON. All messages will be marked as read.",
            off:    "✉️ *Auto-Read Messages* is OFF.",
            groups: "✉️ *Auto-Read Messages* set to *Groups only*.",
            dm:     "✉️ *Auto-Read Messages* set to *DMs only*.",
        };
        reply(`✅ ${msgs[val]}`);
    }
);

// ─── 10. SETANTIFLOOD ────────────────────────────────────────────────────────

gmd(
    {
        pattern: "setantiflood",
        aliases: ["antiflood", "floodprotect"],
        react: "🌊",
        description: "Toggle message flood protection in groups — .setantiflood on/off",
        category: "settings",
        ownerOnly: OWNER_ONLY,
    },
    async (from, Gifted, conText) => {
        const { reply, react, q, isSuperUser } = conText;
        if (!isSuperUser) return reply("❌ Owner Only Command!");
        const val = onOff(q);
        if (!val) return reply("❌ Usage: `.setantiflood on` or `.setantiflood off`");
        await setSetting("ANTI_FLOOD", val);
        await react("✅");
        reply(val === "true"
            ? "🌊 *Anti-Flood* is ON. Rapid message spamming in groups will be blocked."
            : "🌊 *Anti-Flood* is OFF.");
    }
);

// ─── 11. SETFLOОДLIMIT ────────────────────────────────────────────────────────

gmd(
    {
        pattern: "setfloodlimit",
        aliases: ["floodlimit", "floodmax"],
        react: "🌊",
        description: "Set number of messages per 5s before flood action — .setfloodlimit 5",
        category: "settings",
        ownerOnly: OWNER_ONLY,
    },
    async (from, Gifted, conText) => {
        const { reply, react, q, isSuperUser } = conText;
        if (!isSuperUser) return reply("❌ Owner Only Command!");
        const num = parseInt(q);
        if (isNaN(num) || num < 2 || num > 30)
            return reply("❌ Provide a number between 2 and 30.\nExample: `.setfloodlimit 5`");
        await setSetting("FLOOD_LIMIT", num.toString());
        await react("✅");
        reply(`✅ Flood limit set to *${num} messages per 5 seconds*.`);
    }
);

// ─── 12. SETANTICALLACTION ───────────────────────────────────────────────────

gmd(
    {
        pattern: "setanticallaction",
        aliases: ["anticallaction", "callaction"],
        react: "📵",
        description: "Set action for rejected calls — .setanticallaction reject/warn/block",
        category: "settings",
        ownerOnly: OWNER_ONLY,
    },
    async (from, Gifted, conText) => {
        const { reply, react, q, isSuperUser } = conText;
        if (!isSuperUser) return reply("❌ Owner Only Command!");
        const valid = ["reject", "warn", "block"];
        const action = (q || "").trim().toLowerCase();
        if (!valid.includes(action))
            return reply("❌ Usage: `.setanticallaction reject` | `.setanticallaction warn` | `.setanticallaction block`");
        await setSetting("ANTICALL_ACTION", action);
        await react("✅");
        const msgs = {
            reject: "📵 Calls will be *rejected* silently.",
            warn:   "⚠️ Caller will receive a *warning message* when their call is rejected.",
            block:  "🚫 Caller will be *blocked* after their call is rejected.",
        };
        reply(`✅ Anti-call action set to *${action}*.\n${msgs[action]}`);
    }
);

// ─── 13. SETGROUPONLYCMD ─────────────────────────────────────────────────────

gmd(
    {
        pattern: "setgrouponly",
        aliases: ["grouponly", "grouponlycmd"],
        react: "👥",
        description: "Restrict bot commands to groups only — .setgrouponly on/off",
        category: "settings",
        ownerOnly: OWNER_ONLY,
    },
    async (from, Gifted, conText) => {
        const { reply, react, q, isSuperUser } = conText;
        if (!isSuperUser) return reply("❌ Owner Only Command!");
        const val = onOff(q);
        if (!val) return reply("❌ Usage: `.setgrouponly on` or `.setgrouponly off`");
        await setSetting("GROUP_ONLY_COMMANDS", val);
        await react("✅");
        reply(val === "true"
            ? "👥 *Group-Only Mode* is ON. Commands only work inside groups."
            : "👥 *Group-Only Mode* is OFF. Commands work everywhere.");
    }
);

// ─── 14. SETBOTVERSION ───────────────────────────────────────────────────────

gmd(
    {
        pattern: "setbotversion",
        aliases: ["botversion", "setversion"],
        react: "🔢",
        description: "Manually set the bot version string — .setbotversion 5.1.0",
        category: "settings",
        ownerOnly: OWNER_ONLY,
    },
    async (from, Gifted, conText) => {
        const { reply, react, q, isSuperUser } = conText;
        if (!isSuperUser) return reply("❌ Owner Only Command!");
        if (!q) return reply("❌ Provide a version string.\nExample: `.setbotversion 5.1.0`");
        await setSetting("BOT_VERSION", q.trim());
        await react("✅");
        reply(`✅ Bot version set to *v${q.trim()}*.`);
    }
);

// ─── 15. SETTINGSHELP ────────────────────────────────────────────────────────

gmd(
    {
        pattern: "settingshelp",
        aliases: ["setshelp", "newsettings"],
        react: "📋",
        description: "Show all new settings4 commands",
        category: "settings",
    },
    async (from, Gifted, conText) => {
        const { reply, react } = conText;
        await react("📋");
        reply(
`📋 *SETTINGS4 — NEW COMMANDS*
╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍╍

📵 *.setanticallmsg* <text>
   → Custom message when a call is rejected

💬 *.setdmaction* block/warn/ignore
   → What to do with non-permitted DMs

✉️ *.setdmmsg* <text>
   → Message sent to blocked DM senders

👁️ *.setantiviewonce* on/off/indm
   → Forward view-once media to yourself

🕵️ *.setvvtracker* on/off
   → Track who views view-once messages

🔗 *.setautojoin* on/off
   → Auto-accept group invite links

🔄 *.setautoupdate* on/off
   → Automatic bot updates

⚠️ *.setwarncount* <number>
   → Max warnings before action (default: 3)

✉️ *.setautoreadmsgs* on/off/groups/dm
   → Auto-mark messages as read

🌊 *.setantiflood* on/off
   → Block rapid message spamming

🌊 *.setfloodlimit* <number>
   → Messages per 5s before flood triggers

📵 *.setanticallaction* reject/warn/block
   → Action taken when a call is rejected

👥 *.setgrouponly* on/off
   → Restrict commands to groups only

🔢 *.setbotversion* <version>
   → Manually set the bot version string

> Use _.settingsinfo_ to see all current values.`
        );
    }
);
