module.exports = {
  name: 'ping',
  description: 'Check bot response',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, { text: 'Pong! ADEZ-XMD is online ✅' });
  }
};
