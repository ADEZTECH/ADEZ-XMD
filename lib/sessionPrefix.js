const fs = require('fs');
const path = require('path');

const sessionDir = path.join(__dirname, 'session');
const credsPath = path.join(sessionDir, 'creds.json');
const loginFile = path.join(sessionDir, 'login.json');
const envPath = path.join(process.cwd(), '.env');
const SESSION_PREFIX = 'ADEZ-XMD:~';

function updateEnvPrefix() {
  if (!fs.existsSync(envPath)) return;

  let content = fs.readFileSync(envPath, 'utf8');
  content = content.replace(/SESSION_ID\s*=\s*BONY-XMD:~/i, 'SESSION_ID=ADEZ-XMD:~');
  content = content.replace(/SESSION_ID\s*=\s*ADEZ-XMD:~/i, 'SESSION_ID=ADEZ-XMD:~');

  if (!content.includes('SESSION_ID=')) {
    content += '\nSESSION_ID=ADEZ-XMD:~\n';
  }

  fs.writeFileSync(envPath, content);
}

function getRawSessionId() {
  let value = process.env.SESSION_ID || '';
  if (!value && fs.existsSync('./SESSION_ID')) {
    value = fs.readFileSync('./SESSION_ID', 'utf8');
  }
  return value.trim().replace(/^['"]|['"]$/g, '');
}

function isValidSessionId(id) {
  return typeof id === 'string' && id.startsWith(SESSION_PREFIX) && id.length > SESSION_PREFIX.length + 10;
}

module.exports = {
  SESSION_PREFIX,
  SESSION_PREFIX_LEGACY: 'BONY-XMD:~',
  updateEnvPrefix,
  getRawSessionId,
  isValidSessionId,
  sessionExists: () => fs.existsSync(credsPath),
  saveLoginMethod: async (method) => {
    await fs.promises.mkdir(sessionDir, { recursive: true });
    await fs.promises.writeFile(loginFile, JSON.stringify({ method }, null, 2));
  }
};
