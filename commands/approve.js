module.exports = {
  name: 'unmute',
  description: 'Unmute a user',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, { text: 'Unmute command ready.' });
  }
};
