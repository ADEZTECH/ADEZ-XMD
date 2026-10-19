module.exports = {
  name: 'hidetag',
  description: 'Hide tag command',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, { text: 'Hide-tag command ready.' });
  }
};
