module.exports = {
  name: 'antibadword',
  description: 'Anti badword feature',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, { text: 'Anti-badword moderation enabled.' });
  }
};
