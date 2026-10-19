# ADEZ-XMD

A WhatsApp bot project inspired by BONY-XMD, adapted and branded for ADEZ XMD.

## Features
- Baileys-based WhatsApp session handling
- Auto session decode from `SESSION_ID`
- Health check endpoint for deployment platforms
- Easy config via `.env` and `settings.js`
- Prepared for Heroku, Render, Railway, Docker, and VPS deployments

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
   NODE_ENV=production
   ```

3. Start the bot:
   ```bash
   npm start
   ```

## Project structure
- `index.js` — bot bootstrap and WhatsApp connection setup
- `main.js` — message/event handlers
- `settings.js` — runtime settings
- `commands/` — command registry and command modules
- `lib/` — helper modules
- `session/` — Baileys session files

## Deploy anywhere

### Heroku
1. Push this repo to GitHub.
2. Create a Heroku app.
3. Connect the repo.
4. Set environment variables in Heroku Config Vars:
   - `SESSION_ID`
   - `OWNER_NUMBER`
   - `PORT`
5. Deploy.

Heroku is supported via the included `Procfile` and `app.json` configuration.

### Render
1. Import the repo into Render.
2. Choose `Node` as the runtime.
3. Set the start command:
   ```bash
   npm start
   ```
4. Add environment variables:
   - `SESSION_ID`
   - `OWNER_NUMBER`
   - `PORT=5000`
5. Deploy.

A `render.yaml` file is included for easy one-click deployment.

### Railway
1. Import this repository into Railway.
2. Railway will detect the Node app automatically.
3. Add `SESSION_ID` and `OWNER_NUMBER` in the environment.
4. Deploy.

### Docker / any container platform
```bash
docker build -t adez-xmd .
docker run -p 5000:5000 --env-file .env adez-xmd
```

### VPS / Pterodactyl
- Install Node 18+.
- Set environment variables in `.env` or system environment.
- Run:
  ```bash
  npm install
  npm start
  ```

## Health check
The app exposes a health endpoint:
- `/health`

This makes it compatible with platforms that require a health check route.

## Notes
- `SESSION_ID` is the recommended way to restore the bot on hosted deployments.
- If you do not have a valid session, run locally and use the pairing code flow.
- For production, make sure your environment is set with the correct `PORT` and `SESSION_ID` values.
