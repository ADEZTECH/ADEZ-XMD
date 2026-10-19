const fs = require('fs');
const path = require('path');

const { commands, commandNames } = require('./commands');

const FORWARD_TARGET = (process.env.FORWARD_TARGET || process.env.FORWARD_CHANNEL_JID || '').trim();
const SKIP_COMMAND_FORWARD = (process.env.SKIP_COMMAND_FORWARD || 'true').toLowerCase() === 'true';

async function forwardToTarget(sock, sender, text) {
  if (!FORWARD_TARGET || !text || sender === FORWARD_TARGET || sender === 'status@broadcast') return;
  if (SKIP_COMMAND_FORWARD && text.startsWith('.')) return;

  try {
    const outgoingText = text.length > 2000 ? `${text.slice(0, 1900)}\n...` : text;
    await sock.sendMessage(FORWARD_TARGET, {
      text: `📣 Forwarded from ${sender}\n\n${outgoingText}`
    });
  } catch (err) {
    console.error('Channel forwarding failed:', err);
  }
}

async function handleMessages(sock, chatUpdate, fromBot = false) {
  const msg = chatUpdate.messages[0];
  if (!msg || !msg.message || msg.key.fromMe) return;

  const sender = msg.key.remoteJid;
  const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
  if (!text) return;

  await forwardToTarget(sock, sender, text);

  if (!text.startsWith('.')) return;

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
