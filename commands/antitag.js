module.exports = {
  name: 'antilink',
  description: 'Anti-link moderation',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, { text: 'Anti-link moderation enabled.' });
  }
};
