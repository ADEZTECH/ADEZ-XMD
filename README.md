# ADEZ-XMD

A WhatsApp bot project inspired by BONY-XMD, adapted and branded for ADEZ XMD.

## Features
- Baileys-based WhatsApp session handling
- Auto session decode from `SESSION_ID`
- Health check endpoint for deployment platforms
- Easy config via `.env` and `settings.js`
- Prepared for Heroku/Render/Railway deployment

## Quick start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file:
   ```env
   SESSION_ID=BONY-XMD:~<your_session_here>
   OWNER_NUMBER=254700000000
   PORT=5000
   ```

3. Start the bot:
   ```bash
   npm start
   ```

## Project structure
- `index.js` — bot bootstrap and WhatsApp connection setup
- `main.js` — message/event handlers
- `settings.js` — runtime settings
- `data/` — JSON data storage
- `session/` — Baileys session files

## Deploy
This project is prepared for platforms such as:
- Heroku
- Render
- Railway
- Pterodactyl / VPS

## Notes
- `SESSION_ID` is the recommended way to restore the bot on hosted deployments.
- To use pairing code login, run locally and choose the interactive number-based flow.
