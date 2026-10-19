module.exports = {
  name: 'mute',
  description: 'Mute a user',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, { text: 'Mute command ready.' });
  }
};
