module.exports = {
  name: 'antitag',
  description: 'Anti-tag moderation',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, { text: 'Anti-tag moderation enabled.' });
  }
};
