/**
 * ADEZ-XMD
 * WhatsApp Bot starter based on BONY-XMD architecture.
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const axios = require('axios');
const express = require('express');
const os = require('os');

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

const sessionDir = path.join(__dirname, 'session');
const credsPath = path.join(sessionDir, 'creds.json');
const loginFile = path.join(sessionDir, 'login.json');
const envPath = path.join(process.cwd(), '.env');
const SESSION_PREFIX = 'BONY-XMD:~';

global.isBotConnected = false;
global.activeBotSocket = null;
global.botStartPromise = null;
global.reconnectTimer = null;
global.reconnectAttempts = 0;

function log(message, color = 'white', isError = false) {
  const prefix = chalk.magenta.bold('[ ADEZ-XMD ]');
  const logFn = isError ? console.error : console.log;
  const colored = chalk[color] ? chalk[color](message) : message;
  if (message.includes('\n') || message.includes('════')) {
    logFn(prefix, colored);
  } else {
    logFn(`${prefix} ${colored}`);
  }
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

function sessionExists() {
  return fs.existsSync(credsPath);
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
    const decoded = Buffer.from(base64, 'base64');
    await fs.promises.writeFile(credsPath, decoded);
    log('✅ Session decoded and saved', 'green');
  } catch (err) {
    log(`Error decoding session data: ${err.message}`, 'red', true);
    throw err;
  }
}

async function requestPairingCode(socket) {
  try {
    log('Waiting 3 seconds before requesting pairing code...', 'yellow');
    await delay(3000);
    let code = await socket.requestPairingCode(process.env.OWNER_NUMBER || '');
    code = code?.match(/.{1,4}/g)?.join('-') || code;
    log(chalk.bgGreen.black(`\nYour Pairing Code: ${code}\n`), 'white');
    log('Open WhatsApp → Settings → Linked Devices → Link a Device', 'blue');
    return true;
  } catch (err) {
    log(`Failed to get pairing code: ${err.message}`, 'red', true);
    return false;
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

async function startBotInternal() {
  log('Connecting to WhatsApp...', 'cyan');
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('./session');
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
    if (!mek || !mek.message) return;

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
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
        log('Session invalid or logged out. Please refresh the session.', 'red', true);
        process.exit(1);
      }
      log('Connection closed. Reconnecting...', 'yellow');
      setTimeout(() => startBot(), 5000);
    }

    if (connection === 'open') {
      global.isBotConnected = true;
      log('ADEZ-XMD BOT CONNECTED ✅', 'green');
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

async function init() {
  try {
    await loadCoreModules();
  } catch (err) {
    log(`Failed to load core modules: ${err.message}`, 'red', true);
  }

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
  const socket = await startBot();
  await requestPairingCode(socket);
}

const app = express();
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('<h1>ADEZ-XMD WhatsApp Bot is running ✅</h1>');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), connected: global.isBotConnected, platform: process.env.DYNO ? 'heroku' : 'other' });
});

app.listen(PORT, '0.0.0.0', () => {
  log(`✅ Web server listening on port ${PORT}`, 'green');
});

init().catch(err => log(`Fatal error starting bot: ${err.message}`, 'red', true));
process.on('uncaughtException', err => log(`Uncaught Exception: ${err.message}`, 'red', true));
process.on('unhandledRejection', err => log(`Unhandled Rejection: ${err?.message}`, 'red', true));
