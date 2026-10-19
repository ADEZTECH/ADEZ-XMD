module.exports = {
  name: 'mention',
  description: 'Mention command',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, { text: 'Mention command ready.' });
  }
};
