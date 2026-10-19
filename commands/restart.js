module.exports = {
  name: 'clear',
  description: 'Clear bot cache',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, { text: 'Clear action ready.' });
  }
};
