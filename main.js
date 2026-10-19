const fs = require('fs');
const path = require('path');

const { commands, commandNames } = require('./commands');

async function handleMessages(sock, chatUpdate, fromBot = false) {
  const msg = chatUpdate.messages[0];
  if (!msg || !msg.message) return;

  const sender = msg.key.remoteJid;
  const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
  if (!text) return;

  if (!text.startsWith('.')) {
    try {
      await sock.sendMessage(sender, {
        text: '✅ ADEZ-XMD is online. Use .help to see commands.'
      });
    } catch (err) {
      console.error('Welcome alert failed:', err);
    }
    return;
  }

  const trimmed = text.trim();
  const [rawCommand, ...args] = trimmed.slice(1).split(/\s+/);
  const commandName = rawCommand.toLowerCase();

  const handler = commands[commandName] || commands.help;
  try {
    await handler.run({ sock, msg, args, sender, text, commandName, commandNames, fromBot });
  } catch (err) {
    console.error('Command error:', err);
    await sock.sendMessage(sender, { text: `⚠️ Error running command: ${err.message}` });
  }
}

async function handleGroupParticipantUpdate() {
  return true;
}

async function handleStatus() {
  return true;
}

module.exports = {
  handleMessages,
  handleGroupParticipantUpdate,
  handleStatus
};
