module.exports = {
  name: 'settings',
  description: 'Bot settings',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, { text: 'Settings command ready.' });
  }
};
