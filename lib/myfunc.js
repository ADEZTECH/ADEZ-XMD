const fs = require('fs');
const path = require('path');

async function handleMessages(sock, chatUpdate, fromBot = false) {
  const msg = chatUpdate.messages[0];
  if (!msg || !msg.message) return;

  const sender = msg.key.remoteJid;
  const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

  if (!text) return;

  if (text.toLowerCase() === 'hi') {
    await sock.sendMessage(sender, { text: 'Hello from ADEZ-XMD! 👋' });
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
