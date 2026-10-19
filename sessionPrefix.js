const fs = require('fs');
const path = require('path');
const { updateEnvPrefix } = require('./lib/sessionPrefix');

updateEnvPrefix();

require('dotenv').config();

const sessionDir = path.join(__dirname, 'session');
const credsPath = path.join(sessionDir, 'creds.json');
const loginFile = path.join(sessionDir, 'login.json');
const envPath = path.join(process.cwd(), '.env');
const SESSION_PREFIX = 'ADEZ-XMD:~';

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

console.log('ADEZ-XMD session prefix active:', SESSION_PREFIX);
module.exports = { SESSION_PREFIX, getRawSessionId, isValidSessionId };
