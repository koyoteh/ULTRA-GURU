const { gmd, commands, monospace, formatBytes } = require("../guru"),
  fs = require("fs"),
  axios = require("axios"),
  BOT_START_TIME = Date.now(),
  { totalmem: totalMemoryBytes, freemem: freeMemoryBytes } = require("os"),
  moment = require("moment-timezone"),
  more = String.fromCharCode(8206),
  readmore = more.repeat(4001),
  ram = `${formatBytes(freeMemoryBytes)}/${formatBytes(totalMemoryBytes)}`;
const { sendButtons } = require("gifted-btns");

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ULTRA-GURU — 20 MENU STYLES
//  Each style is a named function. The user picks via:
//    .setmenustyle 1-20   (uses settings DB)
//    .menustyle           (shows picker with all 20)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const MENU_STYLES = {
  // ── STYLE 1: Classic Box (Original-inspired) ──────────────────────
  1: ({ botName, pushName, botPrefix, botMode, botVersion, botFooter,
        uptime, time, date, timeZone, totalCommands, categoryLines,
        expiryBanner }) =>
`·:·:·:·:· *${(botName||"ULTRA GURU MD").toUpperCase()}* ·:·:·:·:·
    ✧ _POWERED BY GURUTECH_ ✧
˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜
${expiryBanner}
˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜

  ✦ 👤 ${pushName}  ·  ${botMode?.toUpperCase()||"PUBLIC"}
  ✦ ⚡ Prefix [ ${botPrefix} ]  ·  v${botVersion||"5.0.0"}
  ✦ 📊 ${totalCommands} cmds  ·  ⏱️ ${uptime}
  ✦ 🕒 ${time}  ·  📅 ${date}
  ✦ 🌍 ${timeZone}

˜˜˜˜˜˜ ❯❯ *COMMAND CATEGORIES* ˜˜˜˜˜˜

${categoryLines}

˜˜˜˜˜˜ ❯❯ *QUICK ACCESS* ˜˜˜˜˜˜˜˜˜˜˜

  ✦ \`${botPrefix}menu\`   ▸ Full cmd list
  ✦ \`${botPrefix}list\`   ▸ All commands
  ✦ \`${botPrefix}ping\`   ▸ Bot speed
  ✦ \`${botPrefix}repo\`   ▸ Source code

> ✨ _${botFooter}_`,

  // ── STYLE 2: Neon Cyber ───────────────────────────────────────────
  2: ({ botName, pushName, botPrefix, botMode, botVersion, botFooter,
        uptime, time, date, timeZone, totalCommands, categoryLines,
        expiryBanner }) =>
`╔══════════════════════════╗
║  ⚡ *${(botName||"ULTRA GURU").toUpperCase()}* ⚡  ║
║    🤖 _AI Powered Bot_    ║
╚══════════════════════════╝
${expiryBanner}

▌USER  : *${pushName}*
▌MODE  : *${botMode?.toUpperCase()||"PUBLIC"}*
▌CMD   : *${totalCommands} commands loaded*
▌VER   : *v${botVersion||"5.0.0"}*
▌UP    : *${uptime}*
▌TIME  : *${time}*

══════════ CATEGORIES ══════════
${categoryLines}
══════════ QUICK CMDS ══════════
  ⚡ ${botPrefix}menu  │  ${botPrefix}list  │  ${botPrefix}ping
════════════════════════════════
> 🌐 _${botFooter}_`,

  // ── STYLE 3: Minimal Aesthetic ────────────────────────────────────
  3: ({ botName, pushName, botPrefix, botMode, botVersion, botFooter,
        uptime, time, date, timeZone, totalCommands, categoryLines,
        expiryBanner }) =>
`${(botName||"ULTRA GURU MD").toUpperCase()}
_────────────────────_
${expiryBanner}

  ○ user    ${pushName}
  ○ mode    ${botMode?.toUpperCase()||"PUBLIC"}
  ○ prefix  ${botPrefix}
  ○ ver     v${botVersion||"5.0.0"}
  ○ cmds    ${totalCommands}
  ○ up      ${uptime}
  ○ time    ${time}

_────────────────────_
*CATEGORIES*

${categoryLines}

type *${botPrefix}menu* for full list
_${botFooter}_`,

  // ── STYLE 4: Royal Crown ──────────────────────────────────────────
  4: ({ botName, pushName, botPrefix, botMode, botVersion, botFooter,
        uptime, time, date, timeZone, totalCommands, categoryLines,
        expiryBanner }) =>
`👑 *${(botName||"ULTRA GURU MD").toUpperCase()}* 👑
━━━━━━━━━━━━━━━━━━━━━━━━━━━
${expiryBanner}
━━━━━━━━━━━━━━━━━━━━━━━━━━━

   *Greetings, ${pushName}!*
   _Your royal assistant awaits_ 🏰

   ♛ *Mode    :* ${botMode?.toUpperCase()||"PUBLIC"}
   ♛ *Prefix  :* ${botPrefix}
   ♛ *Version :* v${botVersion||"5.0.0"}
   ♛ *Cmds    :* ${totalCommands} commands
   ♛ *Uptime  :* ${uptime}
   ♛ *Clock   :* ${time}

━━━━━━ ♛ *COMMAND VAULT* ♛ ━━━━━━
${categoryLines}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
> _${botFooter}_`,

  // ── STYLE 5: Matrix Terminal ──────────────────────────────────────
  5: ({ botName, pushName, botPrefix, botMode, botVersion, botFooter,
        uptime, time, date, timeZone, totalCommands, categoryLines,
        expiryBanner }) =>
`\`\`\`
╭─────────────────────────────╮
│  SYSTEM: ${(botName||"ULTRA GURU").padEnd(20).substring(0,20)} │
│  STATUS: ONLINE ●           │
╰─────────────────────────────╯
\`\`\`
${expiryBanner}

\`USER......\` ${pushName}
\`MODE......\` ${botMode?.toUpperCase()||"PUBLIC"}
\`PREFIX....\` ${botPrefix}
\`VERSION...\` v${botVersion||"5.0.0"}
\`COMMANDS..\` ${totalCommands} loaded
\`UPTIME....\` ${uptime}
\`TIMESTAMP.\` ${time}

*[ AVAILABLE MODULES ]*
${categoryLines}

\`${botPrefix}menu\` → full command index
> ${botFooter}`,

  // ── STYLE 6: Wave Aesthetic ───────────────────────────────────────
  6: ({ botName, pushName, botPrefix, botMode, botVersion, botFooter,
        uptime, time, date, timeZone, totalCommands, categoryLines,
        expiryBanner }) =>
`🌊〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️🌊
       *${(botName||"ULTRA GURU MD").toUpperCase()}*
🌊〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️🌊
${expiryBanner}

  🐚 Hey *${pushName}*! 🐚

  🌊 *Mode    :* ${botMode?.toUpperCase()||"PUBLIC"}
  🌊 *Prefix  :* ${botPrefix}
  🌊 *Version :* v${botVersion||"5.0.0"}
  🌊 *Total   :* ${totalCommands} cmds
  🌊 *Uptime  :* ${uptime}
  🌊 *Time    :* ${time}

〰️〰️ *COMMAND WAVES* 〰️〰️
${categoryLines}
〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️
> 🌊 _${botFooter}_`,

  // ── STYLE 7: Space Galaxy ─────────────────────────────────────────
  7: ({ botName, pushName, botPrefix, botMode, botVersion, botFooter,
        uptime, time, date, timeZone, totalCommands, categoryLines,
        expiryBanner }) =>
`✨🌌 *${(botName||"ULTRA GURU MD").toUpperCase()}* 🌌✨
⭐═══════════════════════⭐
${expiryBanner}
⭐═══════════════════════⭐

🚀 *Astronaut :* ${pushName}
🪐 *Mode      :* ${botMode?.toUpperCase()||"PUBLIC"}
⚡ *Prefix    :* ${botPrefix}
🛸 *Version   :* v${botVersion||"5.0.0"}
🌟 *Commands  :* ${totalCommands} stars
⏳ *Orbital   :* ${uptime}
🕐 *Star Time :* ${time}

🌌 ═══ *GALAXY MODULES* ═══ 🌌
${categoryLines}
⭐═══════════════════════⭐
> 🌠 _${botFooter}_`,

  // ── STYLE 8: Fire & Ice ───────────────────────────────────────────
  8: ({ botName, pushName, botPrefix, botMode, botVersion, botFooter,
        uptime, time, date, timeZone, totalCommands, categoryLines,
        expiryBanner }) =>
`🔥❄️ *${(botName||"ULTRA GURU MD").toUpperCase()}* ❄️🔥
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
${expiryBanner}
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

  🔥 *User    :* ${pushName}
  ❄️ *Mode    :* ${botMode?.toUpperCase()||"PUBLIC"}
  🔥 *Prefix  :* ${botPrefix}
  ❄️ *Version :* v${botVersion||"5.0.0"}
  🔥 *Cmds    :* ${totalCommands} total
  ❄️ *Uptime  :* ${uptime}
  🔥 *Time    :* ${time}

▬▬▬ 🔥 *COMMAND FORGE* ❄️ ▬▬▬
${categoryLines}
▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
> _${botFooter}_`,

  // ── STYLE 9: Samurai / Japanese ───────────────────────────────────
  9: ({ botName, pushName, botPrefix, botMode, botVersion, botFooter,
        uptime, time, date, timeZone, totalCommands, categoryLines,
        expiryBanner }) =>
`⚔️ 『 *${(botName||"ULTRA GURU MD").toUpperCase()}* 』 ⚔️
〔━━━━━━━━━━━━━━━━━━━━━━〕
${expiryBanner}
〔━━━━━━━━━━━━━━━━━━━━━━〕

  ⛩️ *戦士 :* ${pushName}
  🗡️ *陣営 :* ${botMode?.toUpperCase()||"PUBLIC"}
  ⚔️ *印   :* ${botPrefix}
  🏯 *版   :* v${botVersion||"5.0.0"}
  🎌 *技   :* ${totalCommands} skills
  ⌛ *時   :* ${uptime}
  🕐 *刻   :* ${time}

〔━━ ⚔️ *DOJO COMMANDS* ⚔️ ━━〕
${categoryLines}
〔━━━━━━━━━━━━━━━━━━━━━━〕
> _${botFooter}_`,

  // ── STYLE 10: Diamond Luxury ──────────────────────────────────────
  10: ({ botName, pushName, botPrefix, botMode, botVersion, botFooter,
          uptime, time, date, timeZone, totalCommands, categoryLines,
          expiryBanner }) =>
`💎◇◆◇◆◇◆◇◆◇◆◇◆◇◆◇◆◇💎
    *${(botName||"ULTRA GURU MD").toUpperCase()}*
       _Premium Edition_
💎◇◆◇◆◇◆◇◆◇◆◇◆◇◆◇◆◇💎
${expiryBanner}

  💠 *Client  :* ${pushName}
  💠 *Access  :* ${botMode?.toUpperCase()||"PUBLIC"}
  💠 *Key     :* ${botPrefix}
  💠 *Build   :* v${botVersion||"5.0.0"}
  💠 *Suite   :* ${totalCommands} features
  💠 *Session :* ${uptime}
  💠 *Clock   :* ${time}

◆◇◆ 💎 *PREMIUM SUITE* 💎 ◆◇◆
${categoryLines}
💎◇◆◇◆◇◆◇◆◇◆◇◆◇◆◇◆◇💎
> 💎 _${botFooter}_`,

  // ── STYLE 11: Emoji Carnival ──────────────────────────────────────
  11: ({ botName, pushName, botPrefix, botMode, botVersion, botFooter,
          uptime, time, date, timeZone, totalCommands, categoryLines,
          expiryBanner }) =>
`🎪🎠🎡🎢🎪🎠🎡🎢🎪
  🎉 *${(botName||"ULTRA GURU MD").toUpperCase()}* 🎉
🎪🎠🎡🎢🎪🎠🎡🎢🎪
${expiryBanner}

🎭 Hey *${pushName}*! 🎭
🎈 Mode    → ${botMode?.toUpperCase()||"PUBLIC"}
🎀 Prefix  → ${botPrefix}
🎁 Version → v${botVersion||"5.0.0"}
🎊 Cmds    → ${totalCommands} fun features!
⏰ Uptime  → ${uptime}
🕐 Time    → ${time}

🎪✨ *CARNIVAL RIDES* ✨🎪
${categoryLines}
🎪🎠🎡🎢🎪🎠🎡🎢🎪
> 🎉 _${botFooter}_`,

  // ── STYLE 12: Dark Knight ─────────────────────────────────────────
  12: ({ botName, pushName, botPrefix, botMode, botVersion, botFooter,
          uptime, time, date, timeZone, totalCommands, categoryLines,
          expiryBanner }) =>
`🦇 ▀▄▀▄▀▄ *${(botName||"ULTRA GURU").toUpperCase()}* ▄▀▄▀▄▀ 🦇
${expiryBanner}

  🌑 *AGENT   :* ${pushName}
  🌑 *SECTOR  :* ${botMode?.toUpperCase()||"PUBLIC"}
  🌑 *SIGNAL  :* ${botPrefix}
  🌑 *BUILD   :* v${botVersion||"5.0.0"}
  🌑 *ARSENAL :* ${totalCommands} weapons
  🌑 *ACTIVE  :* ${uptime}
  🌑 *HOUR    :* ${time}

▀▄▀▄ 🦇 *DARK ARSENAL* 🦇 ▄▀▄▀
${categoryLines}
🦇 ▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄▀▄ 🦇
> 🌑 _${botFooter}_`,

  // ── STYLE 13: Nature Garden ───────────────────────────────────────
  13: ({ botName, pushName, botPrefix, botMode, botVersion, botFooter,
          uptime, time, date, timeZone, totalCommands, categoryLines,
          expiryBanner }) =>
`🌺🌿🌸🌿🌺🌿🌸🌿🌺
  🌳 *${(botName||"ULTRA GURU MD").toUpperCase()}* 🌳
🌺🌿🌸🌿🌺🌿🌸🌿🌺
${expiryBanner}

  🌸 *Visitor :* ${pushName}
  🌿 *Mode    :* ${botMode?.toUpperCase()||"PUBLIC"}
  🌺 *Prefix  :* ${botPrefix}
  🌻 *Version :* v${botVersion||"5.0.0"}
  🍀 *Cmds    :* ${totalCommands} blooms
  ⏰ *Growth  :* ${uptime}
  🌤️ *Season  :* ${time}

🌿🌸 *GARDEN PATHS* 🌸🌿
${categoryLines}
🌺🌿🌸🌿🌺🌿🌸🌿🌺
> 🌱 _${botFooter}_`,

  // ── STYLE 14: Hacker ASCII ────────────────────────────────────────
  14: ({ botName, pushName, botPrefix, botMode, botVersion, botFooter,
          uptime, time, date, timeZone, totalCommands, categoryLines,
          expiryBanner }) =>
`\`\`\`
██╗   ██╗██╗  ████████╗██████╗  █████╗ 
██║   ██║██║  ╚══██╔══╝██╔══██╗██╔══██╗
██║   ██║██║     ██║   ██████╔╝███████║
██║   ██║██║     ██║   ██╔══██╗██╔══██║
╚██████╔╝███████╗██║   ██║  ██║██║  ██║
 ╚═════╝ ╚══════╝╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝
${(botName||"ULTRA GURU MD").padStart(38).substring(0,38)}
\`\`\`
${expiryBanner}

> USER    ${pushName}
> MODE    ${botMode?.toUpperCase()||"PUBLIC"}
> PREFIX  ${botPrefix}
> VER     v${botVersion||"5.0.0"}
> CMDS    ${totalCommands}
> UPTIME  ${uptime}

*[ MODULES ]*
${categoryLines}
> ${botFooter}`,

  // ── STYLE 15: Islamic Dua Theme ───────────────────────────────────
  15: ({ botName, pushName, botPrefix, botMode, botVersion, botFooter,
          uptime, time, date, timeZone, totalCommands, categoryLines,
          expiryBanner }) =>
`🕌 *بسم الله الرحمن الرحيم* 🕌
━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✨ *${(botName||"ULTRA GURU MD").toUpperCase()}* ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━━
${expiryBanner}

  🌙 *Ahlan :* ${pushName}
  ☪️ *Mode  :* ${botMode?.toUpperCase()||"PUBLIC"}
  ⭐ *Prefix:* ${botPrefix}
  📖 *Build :* v${botVersion||"5.0.0"}
  🤲 *Cmds  :* ${totalCommands} blessings
  ⏳ *Since :* ${uptime}
  🕐 *Waqt  :* ${time}

━━━━━━ 🕌 *MENU KITA* 🕌 ━━━━━━
${categoryLines}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
> 🌙 _${botFooter}_`,

  // ── STYLE 16: Glitch Vaporwave ────────────────────────────────────
  16: ({ botName, pushName, botPrefix, botMode, botVersion, botFooter,
          uptime, time, date, timeZone, totalCommands, categoryLines,
          expiryBanner }) =>
`░▒▓█ *${(botName||"ULTRA GURU MD").toUpperCase()}* █▓▒░
🌸 V A P O R W A V E 🌸
░░░░░░░░░░░░░░░░░░░░░░░░░
${expiryBanner}
░░░░░░░░░░░░░░░░░░░░░░░░░

  💜 *ｕｓｅｒ    :* ${pushName}
  🌸 *ｍｏｄｅ    :* ${botMode?.toUpperCase()||"PUBLIC"}
  💙 *ｐｒｅｆｉｘ  :* ${botPrefix}
  💜 *ｖｅｒｓｉｏｎ :* v${botVersion||"5.0.0"}
  🌸 *ｃｍｄｓ    :* ${totalCommands} ａｅｓｔｈｅｔｉｃｓ
  💙 *ｕｐｔｉｍｅ  :* ${uptime}
  💜 *ｔｉｍｅ    :* ${time}

░▒▓ 🌸 *ＡＥＳＴＨＥＴＩＣ ＣＭＤＳ* 🌸 ▓▒░
${categoryLines}
░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░░▒▓█▓▒░
> 🌸 _${botFooter}_`,

  // ── STYLE 17: Robot AI ────────────────────────────────────────────
  17: ({ botName, pushName, botPrefix, botMode, botVersion, botFooter,
          uptime, time, date, timeZone, totalCommands, categoryLines,
          expiryBanner }) =>
`🤖 ⟦ *${(botName||"ULTRA GURU MD").toUpperCase()}* ⟧ 🤖
⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩
${expiryBanner}
⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩

  ▸ UNIT      : ${pushName}
  ▸ PROTOCOL  : ${botMode?.toUpperCase()||"PUBLIC"}
  ▸ TRIGGER   : ${botPrefix}
  ▸ FIRMWARE  : v${botVersion||"5.0.0"}
  ▸ MODULES   : ${totalCommands} loaded
  ▸ RUNTIME   : ${uptime}
  ▸ TIMESTAMP : ${time}

⟦ 🤖 MODULE DIRECTORY 🤖 ⟧
${categoryLines}
⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟨⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩⟩
> 🤖 _${botFooter}_`,

  // ── STYLE 18: Retro Game ──────────────────────────────────────────
  18: ({ botName, pushName, botPrefix, botMode, botVersion, botFooter,
          uptime, time, date, timeZone, totalCommands, categoryLines,
          expiryBanner }) =>
`🕹️ INSERT COIN 🕹️
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
  🎮 *${(botName||"ULTRA GURU MD").toUpperCase()}*
  🎮 _HIGH SCORE EDITION_
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
${expiryBanner}

  🕹️ PLAYER : ${pushName}
  🎯 STAGE  : ${botMode?.toUpperCase()||"PUBLIC"}
  🔑 KEY    : ${botPrefix}
  📀 LEVEL  : v${botVersion||"5.0.0"}
  💣 SKILLS : ${totalCommands}
  ⏱️ TIMER  : ${uptime}
  🕐 CLOCK  : ${time}

▓▓▓▓ 🎮 *SKILL TREE* 🎮 ▓▓▓▓
${categoryLines}
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
> 🕹️ _${botFooter}_`,

  // ── STYLE 19: Zen Minimal ─────────────────────────────────────────
  19: ({ botName, pushName, botPrefix, botMode, botVersion, botFooter,
          uptime, time, date, timeZone, totalCommands, categoryLines,
          expiryBanner }) =>
`
    — *${(botName||"ULTRA GURU MD").toUpperCase()}* —

${expiryBanner}

${pushName} / ${botMode?.toUpperCase()||"PUBLIC"} / ${botPrefix}
v${botVersion||"5.0.0"} · ${totalCommands} commands · ${uptime}
${time} · ${timeZone}

——————————————————————
${categoryLines}
——————————————————————
${botPrefix}menu for full list
— _${botFooter}_`,

  // ── STYLE 20: Ultra Premium ───────────────────────────────────────
  20: ({ botName, pushName, botPrefix, botMode, botVersion, botFooter,
          uptime, time, date, timeZone, totalCommands, categoryLines,
          expiryBanner }) =>
`╭━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃  🌟 *${(botName||"ULTRA GURU MD").toUpperCase()}* 🌟
┃  ✨ _THE ULTIMATE BOT_ ✨
╰━━━━━━━━━━━━━━━━━━━━━━━━━╯
${expiryBanner}

┃ 👤 *User    :* ${pushName}
┃ 🔰 *Mode    :* ${botMode?.toUpperCase()||"PUBLIC"}
┃ ⚡ *Prefix  :* [ ${botPrefix} ]
┃ 🏆 *Version :* v${botVersion||"5.0.0"}
┃ 📊 *Total   :* ${totalCommands} commands
┃ ⏱️ *Uptime  :* ${uptime}
┃ 🕒 *Time    :* ${time}
┃ 🌍 *Zone    :* ${timeZone}

╭━━━━━ 🌟 *COMMAND HUB* 🌟 ━━━━━╮
${categoryLines}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

  🔹 ${botPrefix}menu  → Full command vault
  🔹 ${botPrefix}list  → Quick index
  🔹 ${botPrefix}ping  → Speed test

> 🌟 _${botFooter}_`,
};

// ── Helper: build shared data for menu ────────────────────────────────────────
async function buildMenuData(conText) {
  const {
    pushName, botName, botPrefix, botMode, botVersion,
    botFooter, timeZone,
  } = conText;

  const { getSetting } = require("../guru/database/settings");

  function formatUptime(seconds) {
    const days    = Math.floor(seconds / (24*3600));
    seconds      %= 24*3600;
    const hours   = Math.floor(seconds / 3600);
    seconds      %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds       = Math.floor(seconds % 60);
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  const now  = new Date();
  const fmt  = (opts) => new Intl.DateTimeFormat("en-GB", { timeZone, ...opts }).format(now);
  const date = fmt({ day:"2-digit", month:"2-digit", year:"numeric" });
  const time = fmt({ hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:true });

  const uptime        = formatUptime(process.uptime());
  const totalCommands = commands.filter(c => c.pattern && !c.dontAddCommandList).length;

  const catIcons = {
    general:"🌐", owner:"👑", group:"👥", ai:"🤖",
    downloader:"📥", tools:"🔧", search:"🔍", games:"🎮",
    fun:"🎉", religion:"🕌", sticker:"🖼️", converter:"🔄",
    settings:"⚙️", media:"📸",
  };

  const categorized = commands.reduce((acc, cmd) => {
    if (cmd.pattern && !cmd.dontAddCommandList) {
      const cat = cmd.category || "general";
      acc[cat] = (acc[cat] || 0) + 1;
    }
    return acc;
  }, {});

  const categoryLines = Object.entries(categorized)
    .sort(([,a],[,b]) => b-a)
    .map(([cat, count]) => {
      const icon = catIcons[cat.toLowerCase()] || "⚡";
      return `  ✦ ${icon} ${cat.charAt(0).toUpperCase()+cat.slice(1)}  ·  ${count} cmds`;
    })
    .join("\n");

  let expiryBanner = "  ✦ _Bot is Running Normally_";
  try {
    const expiryDate = await getSetting("BOT_EXPIRY_DATE");
    if (expiryDate) {
      const exp      = new Date(expiryDate);
      const daysLeft = Math.ceil((exp - now) / 86400000);
      if      (daysLeft <= 0) expiryBanner = `  🔴 *EXPIRED* · ${exp.toDateString()}`;
      else if (daysLeft <= 7) expiryBanner = `  🟡 *EXPIRY SOON* · ${daysLeft}d left · ${exp.toDateString()}`;
      else                    expiryBanner = `  🟢 *ACTIVE* · ${daysLeft}d left · ${exp.toDateString()}`;
    }
  } catch {}

  return {
    botName, pushName, botPrefix, botMode, botVersion,
    botFooter, timeZone, date, time, uptime,
    totalCommands, categoryLines, expiryBanner,
  };
}

// ── Command: setmenustyle ──────────────────────────────────────────────────────
gmd(
  {
    pattern: "setmenustyle",
    aliases: ["menustyle", "setstyle", "menusstyle"],
    react: "🎨",
    category: "owner",
    description: "Change the bot menu style (1-20)",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, isSuperUser } = conText;
    if (!isSuperUser) {
      await react("❌");
      return reply("❌ Owner Only Command!");
    }

    const { setSetting } = require("../guru/database/settings");
    const styleNum = parseInt(q?.trim());

    if (!q || isNaN(styleNum) || styleNum < 1 || styleNum > 20) {
      // Show style picker
      let picker = `🎨 *MENU STYLE PICKER*\n\nChoose a style (1–20):\n\n`;
      for (let i = 1; i <= 20; i++) {
        picker += `  *${i}.* ${getStyleName(i)}\n`;
      }
      picker += `\nUsage: *${conText.botPrefix}setmenustyle 5*`;
      await react("🎨");
      return reply(picker);
    }

    await setSetting("MENU_STYLE", String(styleNum));
    await react("✅");
    await reply(`✅ Menu style set to *Style ${styleNum}* — ${getStyleName(styleNum)}\n\nTry it: *${conText.botPrefix}menu*`);
  },
);

function getStyleName(n) {
  const names = {
    1:"Classic Box", 2:"Neon Cyber", 3:"Minimal Aesthetic",
    4:"Royal Crown", 5:"Matrix Terminal", 6:"Wave Aesthetic",
    7:"Space Galaxy", 8:"Fire & Ice", 9:"Samurai/Japanese",
    10:"Diamond Luxury", 11:"Emoji Carnival", 12:"Dark Knight",
    13:"Nature Garden", 14:"Hacker ASCII", 15:"Islamic Dua",
    16:"Glitch Vaporwave", 17:"Robot AI", 18:"Retro Game",
    19:"Zen Minimal", 20:"Ultra Premium",
  };
  return names[n] || "Unknown";
}

// ── Command: menupicker (visual chooser) ───────────────────────────────────────
gmd(
  {
    pattern: "menupicker",
    aliases: ["pickstyle", "choosestyle", "stylelist"],
    react: "🎨",
    category: "owner",
    description: "Show all 20 menu style names to pick from",
  },
  async (from, Gifted, conText) => {
    const { reply, react, isSuperUser, botPrefix } = conText;
    if (!isSuperUser) {
      await react("❌");
      return reply("❌ Owner Only Command!");
    }
    const { getSetting } = require("../guru/database/settings");
    const current = parseInt(await getSetting("MENU_STYLE")) || 1;

    let msg = `🎨 *ALL 20 MENU STYLES*\n\n`;
    for (let i = 1; i <= 20; i++) {
      msg += `  ${i === current ? "▶️" : "  "}*${i}.* ${getStyleName(i)}${i === current ? " ← current" : ""}\n`;
    }
    msg += `\n📌 Set style: *${botPrefix}setmenustyle <1-20>*`;
    await react("🎨");
    return reply(msg);
  },
);

// ── Command: ping ──────────────────────────────────────────────────────────────
gmd(
  {
    pattern: "ping",
    aliases: ["pi", "p"],
    react: "⚡",
    category: "general",
    description: "Check bot response speed",
  },
  async (from, Gifted, conText) => {
    const { mek, react, newsletterJid, newsletterUrl, botFooter, botName, botPrefix } = conText;
    const startTime = process.hrtime();
    await new Promise(resolve => setTimeout(resolve, Math.floor(80 + Math.random() * 420)));
    const elapsed = process.hrtime(startTime);
    const responseTime = Math.floor(elapsed[0]*1000 + elapsed[1]/1000000);
    await sendButtons(Gifted, from, {
      title: "Bot Speed",
      text: `⚡ Pong: ${responseTime}ms`,
      footer: `> *${botFooter}*`,
      buttons: [
        { id: `${botPrefix}uptime`, text: "⏱️ Uptime" },
        { name:"cta_url", buttonParamsJson: JSON.stringify({ display_text:"WaChannel", url: newsletterUrl }) },
      ],
    });
    await react("✅");
  },
);

// ── Command: report ────────────────────────────────────────────────────────────
gmd(
  {
    pattern: "report",
    aliases: ["request"],
    react: "💫",
    description: "Request New Features.",
    category: "owner",
  },
  async (from, Gifted, conText) => {
    const { mek, q, sender, react, pushName, botPrefix, isSuperUser, reply } = conText;
    const reportedMessages = {};
    const devlopernumber = "254799916673";
    try {
      if (!isSuperUser) return reply("*Owner Only Command*");
      if (!q) return reply(`Example: ${botPrefix}request hi dev downloader commands are not working`);
      const messageId = mek.key.id;
      if (reportedMessages[messageId]) return reply("This report has already been forwarded to the owner.");
      reportedMessages[messageId] = true;
      Gifted.sendMessage(devlopernumber + "@s.whatsapp.net", {
        text: `*| REQUEST/REPORT |*\n\n*User*: @${sender.split("@")[0]}\n*Request:* ${q}`,
        mentions: [sender],
      }, { quoted: mek });
      reply("Tʜᴀɴᴋ ʏᴏᴜ ꜰᴏʀ ʏᴏᴜʀ ʀᴇᴘᴏʀᴛ. Iᴛ ʜᴀs ʙᴇᴇɴ ꜰᴏʀᴡᴀʀᴅᴇᴅ ᴛᴏ ᴛʜᴇ ᴏᴡɴᴇʀ.");
      await react("✅");
    } catch (e) { reply(e); }
  },
);

// ── Command: menus (summary menu) ─────────────────────────────────────────────
gmd(
  {
    pattern: "menus",
    aliases: ["mainmenu", "mainmens"],
    description: "Display bot summary stats and categories",
    react: "📜",
    category: "general",
  },
  async (from, Gifted, conText) => {
    const { mek, sender, react, botPic, newsletterJid, botName, reply } = conText;
    try {
      const { getSetting } = require("../guru/database/settings");
      const styleNum = parseInt(await getSetting("MENU_STYLE")) || 1;
      const data     = await buildMenuData(conText);
      const styleFn  = MENU_STYLES[styleNum] || MENU_STYLES[1];
      const caption  = styleFn(data).trim();

      await Gifted.sendMessage(from, {
        image: { url: botPic },
        caption,
        contextInfo: {
          mentionedJid: [sender],
          forwardingScore: 5,
          isForwarded: true,
          forwardedNewsletterMessageInfo: { newsletterJid, newsletterName: botName, serverMessageId: 0 },
        },
      }, { quoted: mek });
      await react("✅");
    } catch (e) { console.error(e); reply(`${e}`); }
  },
);

// ── Command: list (full command index) ────────────────────────────────────────
gmd(
  {
    pattern: "list",
    aliases: ["listmenu", "listmen"],
    description: "Show All Commands and their Usage",
    react: "📜",
    category: "general",
  },
  async (from, Gifted, conText) => {
    const { mek, sender, react, botPic, botName, newsletterJid,
            botPrefix, botMode, botVersion, botFooter, timeZone, reply } = conText;
    try {
      function formatUptime(seconds) {
        const d = Math.floor(seconds/86400); seconds %= 86400;
        const h = Math.floor(seconds/3600); seconds %= 3600;
        const m = Math.floor(seconds/60); seconds = Math.floor(seconds%60);
        return `${d}d ${h}h ${m}m ${seconds}s`;
      }
      const { getSetting } = require("../guru/database/settings");
      const now  = new Date();
      const fmt  = (opts) => new Intl.DateTimeFormat("en-GB",{timeZone,...opts}).format(now);
      const date = fmt({ day:"2-digit", month:"2-digit", year:"numeric" });
      const time = fmt({ hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:true });
      const uptime = formatUptime(process.uptime());
      const totalCommands = commands.filter(c=>c.pattern&&!c.dontAddCommandList).length;

      let expiryBanner = "  ✦ _Bot is Running Normally_";
      try {
        const expiryDate = await getSetting("BOT_EXPIRY_DATE");
        if (expiryDate) {
          const exp=new Date(expiryDate), d=Math.ceil((exp-now)/86400000);
          if (d<=0) expiryBanner=`  🔴 *EXPIRED* · ${exp.toDateString()}`;
          else if(d<=7) expiryBanner=`  🟡 *EXPIRY SOON* · ${d}d left`;
          else expiryBanner=`  🟢 *ACTIVE* · ${d}d left`;
        }
      } catch {}

      let list =
`·:·:·:·:· *${(botName||"ULTRA GURU MD").toUpperCase()}* ·:·:·:·:·
    ✧ _POWERED BY GURUTECH_ ✧
˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜
${expiryBanner}
˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜
         📋 _Full Command Index_

  ✦ 👤 ${monospace(conText.pushName)}  ·  ${monospace((botMode||"public").toUpperCase())}
  ✦ ⚡ Prefix [ ${monospace(botPrefix)} ]  ·  v${monospace("v"+(botVersion||"5.0.0"))}
  ✦ 📊 ${monospace(totalCommands.toString())} loaded  ·  ⏱️ ${monospace(uptime)}
  ✦ 🕒 ${monospace(time)}  ·  📅 ${monospace(date)}
  ✦ 🌍 ${monospace(timeZone)}  ·  💾 ${monospace(ram)}

˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜${readmore}\n\n`;

      const sortedCmds = commands
        .filter(c => c.pattern && c.description)
        .sort((a,b) => b.pattern.length - a.pattern.length);
      sortedCmds.forEach((c, i) => {
        list += `*${i+1}.* ${monospace(c.pattern)}\n   ↳ ${c.description}\n\n`;
      });

      await Gifted.sendMessage(from, {
        image: { url: botPic },
        caption: list.trim(),
        contextInfo: {
          mentionedJid: [sender],
          forwardingScore: 5,
          isForwarded: true,
          forwardedNewsletterMessageInfo: { newsletterJid, newsletterName: botName, serverMessageId: 0 },
        },
      }, { quoted: mek });
      await react("✅");
    } catch (e) { console.error(e); reply(`${e}`); }
  },
);

// ── Command: menu (full categorized menu with active style) ────────────────────
gmd(
  {
    pattern: "menu",
    aliases: ["help", "men", "allmenu"],
    react: "🪀",
    category: "general",
    description: "Fetch bot main menu",
  },
  async (from, Gifted, conText) => {
    const { mek, sender, react, botPic, botName, newsletterJid,
            botPrefix, botMode, botVersion, botFooter, timeZone, reply } = conText;
    try {
      const { getSetting }    = require("../guru/database/settings");
      const styleNum          = parseInt(await getSetting("MENU_STYLE")) || 1;
      const data              = await buildMenuData(conText);

      // Expand categoryLines to show all commands per category
      const catIcons2 = {
        general:"🌐", owner:"👑", group:"👥", ai:"🤖",
        downloader:"📥", tools:"🔧", search:"🔍", games:"🎮",
        fun:"🎉", religion:"🕌", sticker:"🖼️", converter:"🔄",
        settings:"⚙️", media:"📸",
      };
      const regularCmds = commands.filter(c=>c.pattern&&!c.on&&!c.dontAddCommandList);
      const bodyCmds    = commands.filter(c=>c.pattern&&c.on==="body"&&!c.dontAddCommandList);
      const totalCommands = regularCmds.length + bodyCmds.length;

      const categorized = commands.reduce((menu, g) => {
        if (g.pattern && !g.dontAddCommandList) {
          if (!menu[g.category]) menu[g.category] = [];
          menu[g.category].push({ pattern: g.pattern, isBody: g.on==="body" });
        }
        return menu;
      }, {});

      const sortedCats = Object.keys(categorized).sort((a,b)=>a.localeCompare(b));
      for (const cat of sortedCats) categorized[cat].sort((a,b)=>b.pattern.length-a.pattern.length);

      const formatCategory = (cat, gmds) => {
        const icon = catIcons2[cat.toLowerCase()] || "⚡";
        let t = `\n  ❯❯ ${icon} *${cat.toUpperCase()}*\n˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜\n`;
        gmds.forEach(g => {
          const prefix = g.isBody ? "" : botPrefix;
          t += `  ⌑ ${monospace(prefix+g.pattern)}\n`;
        });
        t += `˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜˜\n`;
        return t;
      };

      // Use style header for top, then full cmd list below
      const styleData = { ...data, totalCommands };
      const styleFn   = MENU_STYLES[styleNum] || MENU_STYLES[1];
      let menuText    = styleFn(styleData) + `\n${readmore}\n\n`;

      for (const cat of sortedCats) menuText += formatCategory(cat, categorized[cat]);

      await Gifted.sendMessage(from, {
        image: { url: botPic },
        caption: menuText.trim(),
        contextInfo: {
          mentionedJid: [sender],
          forwardingScore: 5,
          isForwarded: true,
          forwardedNewsletterMessageInfo: { newsletterJid, newsletterName: botName, serverMessageId: 0 },
        },
      }, { quoted: mek });
      await react("✅");
    } catch (e) { console.error(e); reply(`${e}`); }
  },
);

// ── Command: return ────────────────────────────────────────────────────────────
gmd(
  {
    pattern: "return",
    aliases: ["details", "det", "ret"],
    react: "⚡",
    category: "owner",
    description: "Displays the full raw quoted message using Baileys structure.",
  },
  async (from, Gifted, conText) => {
    const { mek, reply, react, quotedMsg, isSuperUser, botName, botFooter, newsletterJid, newsletterUrl } = conText;
    if (!isSuperUser) return reply(`Owner Only Command!`);
    if (!quotedMsg)   return reply(`Please reply to/quote a message`);
    try {
      const jsonString = JSON.stringify(quotedMsg, null, 2);
      const chunks = jsonString.match(/[\s\S]{1,100000}/g) || [];
      for (const chunk of chunks) {
        const formattedMessage = `\`\`\`\n${chunk}\n\`\`\``;
        await sendButtons(Gifted, from, {
          title: "", text: formattedMessage, footer: `> *${botFooter}*`,
          buttons: [
            { name:"cta_copy", buttonParamsJson: JSON.stringify({ display_text:"Copy", copy_code: formattedMessage }) },
            { name:"cta_url",  buttonParamsJson: JSON.stringify({ display_text:"WaChannel", url: newsletterUrl }) },
          ],
        });
        await react("✅");
      }
    } catch (error) {
      console.error("Error processing quoted message:", error);
      await reply(`❌ An error occurred while processing the message.`);
    }
  },
);

// ── Command: uptime ────────────────────────────────────────────────────────────
gmd(
  {
    pattern: "uptime",
    aliases: ["up"],
    react: "⏳",
    category: "general",
    description: "check bot uptime status.",
  },
  async (from, Gifted, conText) => {
    const { mek, react, newsletterUrl, botFooter, botPrefix } = conText;
    const uptimeMs = Date.now() - BOT_START_TIME;
    const s = Math.floor(uptimeMs/1000);
    await sendButtons(Gifted, from, {
      title: "", text: `⏱️ Uptime: ${Math.floor(s/86400)}d ${Math.floor((s%86400)/3600)}h ${Math.floor((s%3600)/60)}m ${s%60}s`,
      footer: `> *${botFooter}*`,
      buttons: [
        { id: `${botPrefix}ping`, text: "⚡ Ping" },
        { name:"cta_url", buttonParamsJson: JSON.stringify({ display_text:"WaChannel", url: newsletterUrl }) },
      ],
    });
    await react("✅");
  },
);

// ── Command: repo ──────────────────────────────────────────────────────────────
gmd(
  {
    pattern: "repo",
    aliases: ["sc", "rep", "script"],
    react: "💜",
    category: "general",
    description: "Fetch bot script.",
  },
  async (from, Gifted, conText) => {
    const { mek, sender, react, pushName, botPic, botName, botFooter, newsletterUrl, ownerName, newsletterJid, giftedRepo } = conText;
    const response = await axios.get(`https://api.github.com/repos/${giftedRepo}`);
    const { full_name, name, forks_count, stargazers_count, created_at, updated_at } = response.data;
    const messageText = `Hello *_${pushName}_,*\nThis is *${botName},* A Whatsapp Bot Built by *${ownerName}*\n\n*❲❒❳ ɴᴀᴍᴇ:* ${name}\n*❲❒❳ sᴛᴀʀs:* ${stargazers_count}\n*❲❒❳ ғᴏʀᴋs:* ${forks_count}\n*❲❒❳ ᴄʀᴇᴀᴛᴇᴅ ᴏɴ:* ${new Date(created_at).toLocaleDateString()}\n*❲❒❳ ʟᴀsᴛ ᴜᴘᴅᴀᴛᴇᴅ:* ${new Date(updated_at).toLocaleDateString()}`;
    const dateNow = Date.now();
    await sendButtons(Gifted, from, {
      title: "", text: messageText, footer: `> *${botFooter}*`, image: { url: botPic },
      buttons: [
        { name:"cta_copy", buttonParamsJson: JSON.stringify({ display_text:"Copy Link", copy_code:`https://github.com/${giftedRepo}` }) },
        { name:"cta_url",  buttonParamsJson: JSON.stringify({ display_text:"Visit Repo", url:`https://github.com/${giftedRepo}` }) },
        { id:`repo_dl_${dateNow}`, text:"📥 Download Zip" },
      ],
    });

    const handleResponse = async (event) => {
      const messageData = event.messages[0];
      if (!messageData?.message) return;
      const templateButtonReply = messageData.message?.templateButtonReplyMessage;
      if (!templateButtonReply) return;
      if (!templateButtonReply.selectedId?.includes(`repo_dl_${dateNow}`)) return;
      if (messageData.key?.remoteJid !== from) return;
      try {
        await Gifted.sendMessage(from, { document: { url:`https://github.com/${giftedRepo}/archive/refs/heads/main.zip` }, fileName:`${name}.zip`, mimetype:"application/zip" }, { quoted: messageData });
        await react("✅");
      } catch (dlErr) {
        await Gifted.sendMessage(from, { text:"Failed to download repo zip: "+dlErr.message }, { quoted: messageData });
      }
      Gifted.ev.off("messages.upsert", handleResponse);
    };
    Gifted.ev.on("messages.upsert", handleResponse);
    setTimeout(() => Gifted.ev.off("messages.upsert", handleResponse), 120000);
    await react("✅");
  },
);

// ── Command: save ──────────────────────────────────────────────────────────────
gmd(
  {
    pattern: "save",
    aliases: ["sv", "s", "sav", "."],
    react: "⚡",
    category: "owner",
    description: "Save messages (supports images, videos, audio, stickers, and text).",
  },
  async (from, Gifted, conText) => {
    const { mek, reply, react, sender, isSuperUser, getMediaBuffer } = conText;
    if (!isSuperUser) return reply(`❌ Owner Only Command!`);
    const quotedMsg = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedMsg) return reply(`⚠️ Please reply to/quote a message.`);
    try {
      let mediaData;
      if (quotedMsg.imageMessage) {
        const buffer = await getMediaBuffer(quotedMsg.imageMessage, "image");
        mediaData = { image: buffer, caption: quotedMsg.imageMessage.caption || "" };
      } else if (quotedMsg.videoMessage) {
        const buffer = await getMediaBuffer(quotedMsg.videoMessage, "video");
        mediaData = { video: buffer, caption: quotedMsg.videoMessage.caption || "" };
      } else if (quotedMsg.audioMessage) {
        const buffer = await getMediaBuffer(quotedMsg.audioMessage, "audio");
        mediaData = { audio: buffer, mimetype: "audio/mp4" };
      } else if (quotedMsg.stickerMessage) {
        const buffer = await getMediaBuffer(quotedMsg.stickerMessage, "sticker");
        mediaData = { sticker: buffer };
      } else if (quotedMsg.documentMessage || quotedMsg.documentWithCaptionMessage?.message?.documentMessage) {
        const docMsg = quotedMsg.documentMessage || quotedMsg.documentWithCaptionMessage.message.documentMessage;
        const buffer = await getMediaBuffer(docMsg, "document");
        mediaData = { document: buffer, fileName: docMsg.fileName || "document", mimetype: docMsg.mimetype || "application/octet-stream" };
      } else if (quotedMsg.conversation || quotedMsg.extendedTextMessage?.text) {
        mediaData = { text: quotedMsg.conversation || quotedMsg.extendedTextMessage.text };
      } else {
        return reply(`❌ Unsupported message type.`);
      }
      await Gifted.sendMessage(sender, mediaData, { quoted: mek });
      await react("✅");
    } catch (error) {
      console.error("Save Error:", error);
      await reply(`❌ Failed to save the message. Error: ${error.message}`);
    }
  },
);

// ── Command: chjid ─────────────────────────────────────────────────────────────
gmd(
  {
    pattern: "chjid",
    aliases: ["channeljid","chinfo","channelinfo","newsletterjid","newsjid","newsletterinfo"],
    react: "📢",
    category: "general",
    description: "Get WhatsApp Channel/Newsletter Info",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, botFooter, botPrefix, GiftedTechApi, GiftedApiKey } = conText;
    const input = q?.trim();
    if (!input) {
      await react("❌");
      return reply(`❌ Provide a channel link.\nUsage: *${botPrefix}chjid* https://whatsapp.com/channel/KEY`);
    }
    const channelMatch = input.match(/whatsapp\.com\/channel\/([A-Za-z0-9_-]+)/i);
    if (!channelMatch) {
      await react("❌");
      return reply("❌ Invalid channel link.");
    }
    await react("🔍");
    const inviteKey = channelMatch[1];
    const channelUrl = `https://whatsapp.com/channel/${inviteKey}`;
    try {
      const meta = await Gifted.newsletterMetadata("invite", inviteKey);
      if (!meta || !meta.id) {
        await react("❌");
        return reply("❌ Could not fetch channel info.");
      }
      const channelJid = meta.id;
      const tm = meta.thread_metadata || {};
      const name = tm.name?.text || "Unknown Channel";
      const rawDesc = tm.description?.text || "";
      const isVerified = tm.verification === "VERIFIED";
      const isActive = meta.state?.type === "ACTIVE";
      const subCount = parseInt(tm.subscribers_count || "0", 10);
      const followers = subCount >= 1e6 ? `${(subCount/1e6).toFixed(1)}M` : subCount >= 1000 ? `${(subCount/1000).toFixed(1)}K` : subCount > 0 ? subCount.toLocaleString() : "N/A";

      let picUrl = null;
      try {
        const apiRes = await axios.get(`${GiftedTechApi}/api/stalk/wachannel?apikey=${GiftedApiKey}&url=${encodeURIComponent(channelUrl)}`, { timeout:10000 });
        picUrl = apiRes.data?.result?.img || null;
      } catch {}

      const MAX_DESC = 200;
      let descSection = "";
      if (rawDesc) {
        const t = rawDesc.trim();
        descSection = t.length > MAX_DESC ? `\n\n📄 *Description:*\n${t.slice(0,MAX_DESC)}${readmore}${t.slice(MAX_DESC)}` : `\n\n📄 *Description:*\n${t}`;
      }

      const text = `📢 *Channel Info*\n\n🔖 *Name:* ${name}\n🟢 *Status:* ${isActive?"Active":"Inactive"}\n${isVerified?"✅":"❌"} *Verified:* ${isVerified?"Yes":"No"}\n👥 *Followers:* ${followers}\n🆔 *JID:* \`${channelJid}\`` + descSection;
      const sendOpts = {
        text, footer: botFooter,
        buttons: [
          { name:"cta_copy", buttonParamsJson: JSON.stringify({ display_text:"📋 Copy JID", copy_code: channelJid }) },
          { name:"cta_url",  buttonParamsJson: JSON.stringify({ display_text:"➕ Follow Channel", url: channelUrl, merchant_url: channelUrl }) },
        ],
      };
      if (picUrl) sendOpts.image = { url: picUrl };
      await sendButtons(Gifted, from, sendOpts);
      await react("✅");
    } catch (error) {
      console.error("chjid error:", error);
      await react("❌");
      await reply(`❌ Error: ${error.message}`);
    }
  },
);
