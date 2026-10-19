module.exports = {
  name: 'kick',
  description: 'Kick a user',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, { text: 'Kick command ready.' });
  }
};
