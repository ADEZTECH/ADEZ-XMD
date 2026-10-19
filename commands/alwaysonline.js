module.exports = {
  name: 'online',
  description: 'Show online status',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, { text: 'ADEZ-XMD online ✅' });
  }
};
