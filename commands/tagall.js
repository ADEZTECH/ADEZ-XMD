module.exports = {
  name: 'goodbye',
  description: 'Goodbye feature stub',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, { text: 'Goodbye system ready for ADEZ-XMD.' });
  }
};
