module.exports = {
  name: 'antibot',
  description: 'Anti bot protection',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, { text: 'Anti-bot protection enabled.' });
  }
};
