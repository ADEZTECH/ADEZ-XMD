require('dotenv').config();

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const express = require('express');

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  jidNormalizedUser,
  makeCacheableSignalKeyStore,
  delay
} = require('@whiskeysockets/baileys');

const NodeCache = require('node-cache');
const pino = require('pino');
const readline = require('readline');

const app = express();
const DEFAULT_PORT = 10000;
const SESSION_DIR = path.resolve(process.env.SESSION_PATH || process.env.WA_SESSION_DIR || path.join(__dirname, 'session'));
const sessionDir = SESSION_DIR;
const credsPath = path.join(sessionDir, 'creds.json');
const loginFile = path.join(sessionDir, 'login.json');
const envPath = path.join(process.cwd(), '.env');
const SESSION_PREFIX = 'ADEZ-XMD:~';
const PORT = Number(process.env.PORT || DEFAULT_PORT);
const DEFAULT_SITE_URL = 'https://adez-xmd-8nmx.onrender.com';
const WEBSITE_URL = (process.env.WEBSITE_URL || process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_URL || DEFAULT_SITE_URL).trim();

const FORWARD_TARGET = (process.env.FORWARD_TARGET || process.env.FORWARD_CHANNEL_JID || '').trim();
const SKIP_COMMAND_FORWARD = (process.env.SKIP_COMMAND_FORWARD || 'true').toLowerCase() === 'true';

global.isBotConnected = false;
global.isShuttingDown = false;
global.activeBotSocket = null;
global.botStartPromise = null;
global.reconnectTimer = null;
global.pairingState = { status: 'idle', code: null, phoneNumber: '' };
global.sessionRecoveryInProgress = false;
global.sessionResetRequested = false;
global.wasConnected = false;

global.statusAlert = {
  connected: false,
  announced: false
};

app.use(express.json());
app.use(express.static(__dirname));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'pair.html')));
app.get('/pair', (req, res) => res.sendFile(path.join(__dirname, 'pair.html')));
app.get('/health', (req, res) => {
  res.json({
    status: global.isBotConnected ? 'ok' : 'offline',
    uptime: process.uptime(),
    connected: global.isBotConnected,
    platform: process.env.DYNO ? 'heroku' : 'render',
    pairing: global.pairingState,
    website: WEBSITE_URL,
    botName: 'ADEZ-XMD'
  });
});
app.get('/api/pair-status', (req, res) => {
  res.json(global.pairingState);
});
app.post('/api/reset-session', async (req, res) => {
  try {
    await resetSessionAndReinit('manual_api_reset');
    res.json({ status: 'ok', message: 'WhatsApp session reset successfully. Re-pair required.' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to reset session.' });
  }
});
app.post('/api/start-pairing', async (req, res) => {
  try {
    const phoneNumber = String(req.body?.phone || req.query?.phone || process.env.OWNER_NUMBER || '').replace(/\D/g, '');
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    const socket = await startPairingSession(phoneNumber);
    const { code, status } = global.pairingState;
    res.json({
      status,
      phoneNumber,
      code,
      connected: !!global.isBotConnected,
      message: 'Pairing code generated. Open WhatsApp and use the code to link the device.'
    });
  } catch (error) {
    console.error('start-pairing error:', error);
    res.status(500).json({ error: error.message || 'Unable to start pairing.' });
  }
});

function log(message, color = 'white', isError = false) {
  const prefix = chalk.magenta.bold('[ ADEZ-XMD ]');
  const logFn = isError ? console.error : console.log;
  const colored = chalk[color] ? chalk[color](message) : message;
  logFn(`${prefix} ${colored}`);
}

function announceConnectionSuccess() {
  if (global.wasConnected) return;

  const text = [
    '✅ ADEZ-XMD CONNECTED SUCCESSFULLY!',
    '🤖 Bot Name: ADEZ-XMD',
    '📱 WhatsApp: Connected',
    `🌐 Website: ${WEBSITE_URL}`,
    '🚀 Status: Online and ready!'
  ].join('\n');

  log(text, 'green');
  global.wasConnected = true;
  global.statusAlert.connected = true;
  global.statusAlert.announced = true;
}

function announceDisconnection(reason = 'offline') {
  const text = [
    '⚠️ ADEZ-XMD DISCONNECTED',
    `🤖 Bot Name: ADEZ-XMD`,
    `📱 WhatsApp: ${reason === 'offline' ? 'Offline' : reason}`,
    `🌐 Website: ${WEBSITE_URL}`,
    '🚀 Status: Waiting to reconnect...'
  ].join('\n');

  log(text, 'yellow', true);
  global.wasConnected = false;
  global.statusAlert.connected = false;
  global.statusAlert.announced = false;
}

function isValidSessionId(id) {
  return typeof id === 'string' && id.startsWith(SESSION_PREFIX) && id.length > SESSION_PREFIX.length + 10;
}

function getRawSessionId() {
  let value = process.env.SESSION_ID || '';
  if (!value && fs.existsSync('./SESSION_ID')) {
    value = fs.readFileSync('./SESSION_ID', 'utf8');
  }
  return value.trim().replace(/^['"]|['"]$/g, '');
}

function sessionExists() {
  return fs.existsSync(credsPath);
}

function hasMinimalCredsShape() {
  if (!fs.existsSync(credsPath)) return false;

  try {
    const raw = fs.readFileSync(credsPath, 'utf8');
    if (!raw || raw.trim().length < 20) return false;

    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return false;

    const requiredFields = ['noiseKey', 'signedIdentityKey', 'registrationId'];
    return requiredFields.some(field => Object.prototype.hasOwnProperty.call(data, field));
  } catch (_) {
    return false;
  }
}

function saveLoginMethod(method) {
  return fs.promises.mkdir(sessionDir, { recursive: true })
    .then(() => fs.promises.writeFile(loginFile, JSON.stringify({ method }, null, 2)));
}

function getLastLoginMethod() {
  if (fs.existsSync(loginFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(loginFile, 'utf-8'));
      return data.method;
    } catch (_) {
      return null;
    }
  }
  return null;
}

function clearReconnectTimer() {
  if (global.reconnectTimer) {
    clearTimeout(global.reconnectTimer);
    global.reconnectTimer = null;
  }
}

function clearSessionStore() {
  try {
    if (fs.existsSync(sessionDir)) {
      fs.rmSync(sessionDir, { recursive: true, force: true });
    }
    fs.mkdirSync(sessionDir, { recursive: true });
  } catch (err) {
    log(`Unable to clear session directory: ${err.message}`, 'red', true);
  }
}

async function resetSessionAndReinit(reason = 'stale_session') {
  global.sessionResetRequested = true;
  clearReconnectTimer();
  clearSessionStore();
  log(`Session reset requested (${reason}). Re-pairing required.`, 'yellow', true);

  if (global.activeBotSocket) {
    try {
      await global.activeBotSocket.ws?.close();
    } catch (_) {
      // noop
    }
    global.activeBotSocket = null;
  }

  return true;
}

function isStaleSessionError(errorLike) {
  const text = String(errorLike?.message || errorLike || '');
  const normalized = text.toLowerCase();
  const markers = [
    'failed to find key',
    'no session found to decrypt message',
    'failed to decrypt message',
    'app state sync key',
    'missing key',
    'session not found',
    'could not find key',
    'decrypt message'
  ];
  return markers.some(marker => normalized.includes(marker));
}

async function recoverSessionAndPair(reason) {
  if (global.sessionRecoveryInProgress) {
    return;
  }

  global.sessionRecoveryInProgress = true;
  clearReconnectTimer();
  log(`Recovering from stale WhatsApp session (${reason})...`, 'red', true);

  try {
    await resetSessionAndReinit(reason);
    const phone = String(process.env.OWNER_NUMBER || global.pairingState?.phoneNumber || '').replace(/\D/g, '');
    if (!phone) {
      log('No phone number available for re-pairing. Set OWNER_NUMBER or use /api/start-pairing.', 'yellow');
      return;
    }

    const socket = await startPairingSession(phone);
    await requestPairingCode(socket, phone);
  } catch (err) {
    log(`Session recovery failed: ${err.message}`, 'red', true);
  } finally {
    global.sessionRecoveryInProgress = false;
  }
}

async function scheduleReconnect(reason, delayMs = 5000) {
  if (global.isShuttingDown || global.reconnectTimer || global.botStartPromise) {
    return;
  }

  const timeout = Number(delayMs) || 5000;
  log(`Scheduling reconnect in ${timeout}ms (${reason})`, 'yellow');
  global.reconnectTimer = setTimeout(async () => {
    global.reconnectTimer = null;
    try {
      if (!global.activeBotSocket && !global.botStartPromise) {
        await startBot();
      }
    } catch (err) {
      log(`Reconnect attempt failed: ${err.message}`, 'red', true);
      scheduleReconnect('reconnect failure', 10000);
    }
  }, timeout);
}

async function downloadSessionData() {
  try {
    await fs.promises.mkdir(sessionDir, { recursive: true });
    if (fs.existsSync(credsPath)) {
      log('creds.json already present — skipping decode.', 'blue');
      return;
    }

    const id = process.env.SESSION_ID || getRawSessionId();
    if (!id) {
      log('No SESSION_ID to decode.', 'yellow');
      return;
    }

    const base64 = id.startsWith(SESSION_PREFIX) ? id.slice(SESSION_PREFIX.length) : id;
    if (!base64 || !/^[A-Za-z0-9+/=\-]+$/.test(base64)) {
      throw new Error('Invalid SESSION_ID format. It must be valid Base64 data.');
    }

    const decoded = Buffer.from(base64, 'base64');
    if (!decoded || decoded.length === 0) {
      throw new Error('Decoded SESSION_ID produced empty session data.');
    }

    await fs.promises.writeFile(credsPath, decoded);
    log('✅ Session decoded and saved', 'green');
  } catch (err) {
    log(`Error decoding session data: ${err.message}`, 'red', true);
    throw err;
  }
}

async function requestPairingCode(socket, phoneNumber) {
  try {
    log('Waiting 3 seconds before requesting pairing code...', 'yellow');
    await delay(3000);
    let code = await socket.requestPairingCode(phoneNumber || process.env.OWNER_NUMBER || '');
    code = code?.match(/.{1,4}/g)?.join('-') || code;
    global.pairingState = { status: 'pairing', code, phoneNumber: phoneNumber || global.pairingState.phoneNumber, createdAt: Date.now() };
    log(chalk.bgGreen.black(`\nYour Pairing Code: ${code}\n`), 'white');
    log('Open WhatsApp → Settings → Linked Devices → Link a Device', 'blue');
    return code;
  } catch (err) {
    log(`Failed to get pairing code: ${err.message}`, 'red', true);
    throw err;
  }
}

async function sendLinkedAlert(socket) {
  if (!socket || !socket.user?.id) return;

  const target = socket.user.id;
  const message = `✅ ADEZ-XMD is now linked to this WhatsApp account.\n\nBot is online and ready to receive commands.`;

  try {
    await socket.sendMessage(target, { text: message });
    log(`Linked alert sent to ${target}`, 'green');
  } catch (err) {
    log(`Failed to send linked alert to ${target}: ${err.message}`, 'yellow', true);
  }
}

async function loadCoreModules() {
  const mainModules = require('./main');
  global.handleMessages = mainModules.handleMessages;
  global.handleGroupParticipantUpdate = mainModules.handleGroupParticipantUpdate;
  global.handleStatus = mainModules.handleStatus;
  global.smsg = require('./lib/myfunc').smsg;
  global.store = require('./lib/lightweight_store');
  global.store.readFromFile();
  setInterval(() => global.store.writeToFile(), 10000);
}

async function startPairingSession(phoneNumber) {
  if (!phoneNumber) throw new Error('Phone number is required.');

  if (global.activeBotSocket && global.activeBotSocket.user) {
    return global.activeBotSocket;
  }

  await loadCoreModules();

  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const msgRetryCounterCache = new NodeCache();

  const socket = makeWASocket({
    version,
    logger: pino({ level: 'info' }),
    printQRInTerminal: false,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(
        state.keys,
        pino({ level: 'fatal' }).child({ level: 'fatal' })
      )
    },
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
    getMessage: async (key) => {
      const jid = jidNormalizedUser(key.remoteJid);
      const msg = await global.store.loadMessage(jid, key.id);
      return msg?.message || '';
    },
    msgRetryCounterCache
  });

  global.activeBotSocket = socket;
  global.store.bind(socket.ev);

  socket.ev.on('messages.upsert', async chatUpdate => {
    const mek = chatUpdate.messages[0];
    if (!mek || !mek.message || mek.key.fromMe) return;
    const sender = mek.key.remoteJid;
    const text = mek.message.conversation || mek.message.extendedTextMessage?.text || '';
    if (!text) return;

    if (FORWARD_TARGET && !text.startsWith('.') && !sender.includes('status@broadcast')) {
      try {
        await socket.sendMessage(FORWARD_TARGET, { text: `📣 Forwarded from ${sender}\n\n${text}`.slice(0, 2000) });
      } catch (err) {
        console.error('Forward failed:', err);
      }
    }

    try {
      if (global.handleMessages) {
        await global.handleMessages(socket, chatUpdate, true);
      }
    } catch (err) {
      log(err.message, 'red', true);
    }
  });

  socket.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      global.isBotConnected = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const reason = statusCode === DisconnectReason.loggedOut || statusCode === 401 || statusCode === 403 ? 'logged_out' : 'connection_closed';
      const errorMessage = lastDisconnect?.error?.message || '';

      if (global.activeBotSocket === socket) {
        global.activeBotSocket = null;
      }

      announceDisconnection(reason);

      if (lastDisconnect?.error && isStaleSessionError(lastDisconnect.error)) {
        clearReconnectTimer();
        await recoverSessionAndPair(`session-desync:${errorMessage || reason}`);
        return;
      }

      if (statusCode === DisconnectReason.loggedOut || statusCode === 401 || statusCode === 403) {
        log('Session invalid or logged out. Clearing invalid session and waiting for a fresh session.', 'red', true);
        clearSessionStore();
        clearReconnectTimer();
        return;
      }

      log(`Connection closed. Reconnecting... (${reason}, code=${statusCode ?? 'unknown'})`, 'yellow');
      clearReconnectTimer();
      scheduleReconnect(`close:${statusCode ?? reason}`, statusCode === 515 ? 3000 : 6000);
    }

    if (connection === 'open') {
      global.isBotConnected = true;
      clearReconnectTimer();
      announceConnectionSuccess();
      log('ADEZ-XMD BOT CONNECTED ✅', 'green');
      global.pairingState = { status: 'connected', code: global.pairingState.code, phoneNumber: global.pairingState.phoneNumber, createdAt: Date.now() };

      try {
        await sendLinkedAlert(socket);
      } catch (_) {
        // noop
      }
    }
  });

  socket.ev.on('creds.update', saveCreds);

  const code = await requestPairingCode(socket, phoneNumber);
  global.pairingState = { status: 'pairing', code, phoneNumber, createdAt: Date.now() };
  return socket;
}

async function startBotInternal() {
  log('Connecting to WhatsApp...', 'cyan');
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const msgRetryCounterCache = new NodeCache();

  const socket = makeWASocket({
    version,
    logger: pino({ level: 'info' }),
    printQRInTerminal: false,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(
        state.keys,
        pino({ level: 'fatal' }).child({ level: 'fatal' })
      )
    },
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
    getMessage: async (key) => {
      const jid = jidNormalizedUser(key.remoteJid);
      const msg = await global.store.loadMessage(jid, key.id);
      return msg?.message || '';
    },
    msgRetryCounterCache
  });

  global.activeBotSocket = socket;
  global.store.bind(socket.ev);

  socket.ev.on('messages.upsert', async chatUpdate => {
    const mek = chatUpdate.messages[0];
    if (!mek || !mek.message || mek.key.fromMe) return;

    try {
      if (global.handleMessages) {
        await global.handleMessages(socket, chatUpdate, true);
      }
    } catch (err) {
      log(err.message, 'red', true);
    }
  });

  socket.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      global.isBotConnected = false;
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const errorMessage = lastDisconnect?.error?.message || '';
      if (global.activeBotSocket === socket) {
        global.activeBotSocket = null;
      }

      announceDisconnection(statusCode ? String(statusCode) : 'offline');

      if (lastDisconnect?.error && isStaleSessionError(lastDisconnect.error)) {
        clearReconnectTimer();
        await recoverSessionAndPair(`session-desync:${errorMessage || statusCode || 'unknown'}`);
        return;
      }

      if (statusCode === DisconnectReason.loggedOut || statusCode === 401 || statusCode === 403) {
        log('Session invalid or logged out. Clearing invalid session and waiting for a fresh session.', 'red', true);
        clearSessionStore();
        clearReconnectTimer();
        return;
      }

      log(`Connection closed. Reconnecting... (code=${statusCode ?? 'unknown'})`, 'yellow');
      clearReconnectTimer();
      scheduleReconnect(`close:${statusCode ?? 'unknown'}`, statusCode === 515 ? 3000 : 6000);
    }

    if (connection === 'open') {
      global.isBotConnected = true;
      clearReconnectTimer();
      announceConnectionSuccess();
      log('ADEZ-XMD BOT CONNECTED ✅', 'green');

      try {
        await sendLinkedAlert(socket);
      } catch (_) {
        // noop
      }
    }
  });

  socket.ev.on('creds.update', saveCreds);
  return socket;
}

async function startBot() {
  if (global.activeBotSocket) return global.activeBotSocket;
  if (global.botStartPromise) return global.botStartPromise;

  global.botStartPromise = startBotInternal();
  try {
    return await global.botStartPromise;
  } finally {
    global.botStartPromise = null;
  }
}

async function validateSessionBeforeStart() {
  if (!sessionExists()) return;

  const valid = hasMinimalCredsShape();
  if (valid) {
    return;
  }

  log('Stored WhatsApp session looks corrupted or incomplete. Clearing it and re-pairing required.', 'yellow', true);
  clearSessionStore();
}

async function init() {
  try {
    await fs.promises.mkdir(sessionDir, { recursive: true });
  } catch (err) {
    log(`Failed to prepare session storage: ${err.message}`, 'red', true);
  }

  try {
    await loadCoreModules();
  } catch (err) {
    log(`Failed to load core modules: ${err.message}`, 'red', true);
  }

  await validateSessionBeforeStart();

  const envSessionID = getRawSessionId();
  if (envSessionID && isValidSessionId(envSessionID)) {
    log('VALID SESSION_ID found. Starting bot...', 'green');
    await downloadSessionData();
    await saveLoginMethod('session');
    await startBot();
    return;
  }

  if (sessionExists()) {
    log('Stored session found. Starting bot...', 'green');
    await startBot();
    return;
  }

  log('No session found. Starting interactive login...', 'blue');
  const lastMethod = getLastLoginMethod();
  if (lastMethod === 'session' && envSessionID) {
    await downloadSessionData();
    await startBot();
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise(resolve => rl.question('Enter your WhatsApp number (e.g. 254700000000): ', resolve));
  rl.close();
  process.env.OWNER_NUMBER = answer.replace(/\D/g, '');
  const socket = await startPairingSession(process.env.OWNER_NUMBER);
  await requestPairingCode(socket, process.env.OWNER_NUMBER);
}

async function shutdownGracefully(signal) {
  global.isShuttingDown = true;
  clearReconnectTimer();
  if (global.activeBotSocket) {
    try {
      await global.activeBotSocket.ws?.close();
    } catch (_) {
      // noop
    }
  }
  log(`Received ${signal}. Shutting down gracefully.`, 'yellow');
  setTimeout(() => process.exit(0), 250);
}

process.on('SIGINT', () => shutdownGracefully('SIGINT'));
process.on('SIGTERM', () => shutdownGracefully('SIGTERM'));

app.listen(PORT, '0.0.0.0', () => {
  log(`✅ Web server listening on port ${PORT}`, 'green');
});

init().catch(err => log(`Fatal error starting bot: ${err.message}`, 'red', true));
process.on('uncaughtException', err => log(`Uncaught Exception: ${err.message}`, 'red', true));
process.on('unhandledRejection', err => log(`Unhandled Rejection: ${err?.message}`, 'red', true));
