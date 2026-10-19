module.exports = {
  name: 'restart',
  description: 'Restart the bot',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, { text: 'Restart command ready.' });
  }
};
