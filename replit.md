# ULTRA GURU MD — WhatsApp Bot

## Project Overview

**ULTRA GURU MD** is a feature-rich, multi-device WhatsApp bot built by GURUTECH. It automates and enhances the WhatsApp experience with:

- Media downloading (YouTube, social media, etc.)
- AI-powered chat interactions
- Group management tools
- Mini-games and entertainment
- Auto-read/like WhatsApp statuses
- Sticker creation
- Translation and TTS

## Tech Stack

- **Runtime**: Node.js 18 (CommonJS)
- **WhatsApp Library**: `gifted-baileys` (Baileys fork)
- **Database**: PostgreSQL (via Replit's built-in DB) with SQLite fallback
- **ORM**: Sequelize
- **Web Server**: Express (serves status page on port 5000)
- **Media**: ffmpeg for audio/video processing

## Project Structure

```
/
├── index.js          # Obfuscated entry point
├── config.js         # Configuration loader (reads .env or env vars)
├── guru/             # Core framework
│   ├── index.js      # Aggregated exports
│   ├── connection/   # WhatsApp socket & message handling
│   ├── database/     # Sequelize models (settings, sudo, games, etc.)
│   ├── gmdCmds.js    # Command registration system
│   ├── gmdFunctions*.js  # Utility functions
│   └── gifted.html   # Status page served by Express
└── guruh/            # Plugins (command implementations)
    ├── ai.js, downloader.js, group.js, ...
```

## Running the App

```bash
npm start
```

The Express status page is served on **port 5000**.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SESSION_ID` | WhatsApp session ID (required to connect) | — |
| `MODE` | `public` or `private` | `public` |
| `TIME_ZONE` | Your timezone | `Africa/Nairobi` |
| `AUTO_READ_STATUS` | Auto-view WhatsApp statuses | `true` |
| `AUTO_LIKE_STATUS` | Auto-like WhatsApp statuses | `true` |
| `DATABASE_URL` | PostgreSQL URL (falls back to SQLite) | Replit built-in |

## WhatsApp Authentication

When no `SESSION_ID` is configured, the bot prompts for:
1. **Phone Number (Pairing Code)** — generates an 8-digit code to enter in WhatsApp → Linked Devices
2. **Session ID** — paste an existing session ID to resume

Set `SESSION_ID` as a secret in Replit's Secrets tab to skip interactive setup.

## User Preferences

- Use SQLite fallback when PostgreSQL is unavailable
- Keep the Express status page on port 5000
- Deployment target: VM (always-running bot process)
