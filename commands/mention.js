module.exports = {
  name: 'anime',
  description: 'Anime command stub',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, { text: 'Anime module stub is ready.' });
  }
};
