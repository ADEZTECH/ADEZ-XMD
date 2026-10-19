module.exports = {
  name: 'welcome',
  description: 'Welcome feature stub',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, { text: 'Welcome system ready for ADEZ-XMD.' });
  }
};
