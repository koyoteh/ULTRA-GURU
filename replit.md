# ULTRA GURU MD — WhatsApp Bot

A powerful multi-device WhatsApp bot built with Baileys (gifted-baileys), featuring AI, downloaders, group management, games, tools, and many more plugins.

## Architecture

- **Entry Point**: `index.js` — starts the bot and loads session
- **Core Engine**: `guru/` — connection handling, database, command system
- **Plugins**: `guruh/` — all user-facing commands organized by category
- **Config**: `config.js` + `.env` — environment variables

## Key Directories

```
guru/
  connection/     — WhatsApp socket, message handling, group cache
  database/       — SQLite/PostgreSQL via Sequelize (settings, sudo, notes, groups)
  gmdCmds.js      — Command registration system
  gmdFunctions.js — Core utility functions

guruh/
  ai.js           — AI chat (GPT-4, etc.)
  downloader.js   — YouTube, TikTok, Instagram downloaders
  downloader2.js  — Additional download features
  games.js        — Tic-Tac-Toe, word games
  group.js        — Group admin tools
  general.js      — Menu, ping, uptime, repo, save commands
  settings.js     — Bot settings (prefix, mode, welcome, expiry, etc.)
  settings2.js    — Additional group settings
  owner.js        — Owner-only commands (profile pics, reveal, etc.)
  owner2.js       — Extended owner commands
  tools.js        — fetch, sticker, convert tools
  tools2.js       — Additional tool commands
  search.js       — Search commands
  search2.js      — Extended search
  extras.js       — NEW: calc, flip, roll, choose, reverse, morse, base64, joke, fact, quote, password, wordcount, age, countdown, currency, color, emojify, binary, etc.
  converter.js    — Media conversion
  religion.js     — Islamic/religious commands
  sports.js       — Sports info
  tempmail.js     — Temp mail
  shortener.js    — URL shortener
  tourl.js        — Media to URL
  logo.js         — Logo generation
  play.js         — Music/media playback
  notes.js        — Notes system
  whatsapp.js     — WhatsApp-specific tools
  updater.js      — Bot update system
```

## Running the Bot

Start: `node --max-old-space-size=256 index.js`

On first run, you'll be prompted to:
1. Enter phone number (pairing code method), OR
2. Paste an existing SESSION_ID

## Environment Variables

Set in `.env` file or Replit Secrets:
- `SESSION_ID` — Bot WhatsApp session
- `DATABASE_URL` — PostgreSQL URL (optional, falls back to local SQLite)
- `MODE` — public or private
- `TIME_ZONE` — e.g. Africa/Nairobi
- `AUTO_READ_STATUS` — true/false
- `AUTO_LIKE_STATUS` — true/false

## Recent Changes (April 2026)

### New Features Added

**1. `guruh/extras.js` — New Plugin Pack**
- `calc` — Math expression calculator
- `flip` — Coin flip
- `roll` — Dice roll (customizable sides)
- `choose` — Random choice from options
- `reverse` — Reverse any text
- `mock` — SpongeBob mocking text
- `upper` / `lower` — Text case conversion
- `binary` — Text ↔ Binary conversion
- `morse` — Text ↔ Morse code
- `base64` — Encode/Decode Base64
- `password` — Secure random password generator
- `wordcount` — Word/character/sentence counter
- `age` — Age calculator from birthdate
- `countdown` — Days until a future date
- `joke` — Random jokes (with fallback)
- `fact` — Random interesting facts (with fallback)
- `quote` — Inspirational quotes (with fallback)
- `repeat` — Repeat text N times
- `number` — Fun facts about a number
- `acronym` — Create acronym from words
- `currency` — Live currency conversion
- `emojify` — Add random emojis to text
- `color` — Hex color code info

**2. New Menu Design**
- Redesigned `menu`, `menus`, and `list` commands with improved box-drawing layout
- Category icons for each command group
- Expiry date indicator shown inline in the menu header

**3. Bot Expiry Date System (in `guruh/settings.js`)**
- `setexpiry YYYY-MM-DD` — Set a bot access expiry date
- `checkexpiry` — View expiry status with color-coded alerts (green/yellow/red)
- `clearexpiry` — Remove the expiry date

## Dependencies Notes

Native modules that require compilation:
- `better-sqlite3` — SQLite driver (prebuilt)
- `sharp` — Image processing (needs: `cd node_modules/sharp && npm run install`)
- `wa-sticker-formatter/sharp` — Also needs: `cd node_modules/wa-sticker-formatter/node_modules/sharp && npm run install`

System dependencies needed:
- `python3`, `gnumake`, `gcc` — For native module builds
- `python312Packages.setuptools` — For node-gyp compatibility
