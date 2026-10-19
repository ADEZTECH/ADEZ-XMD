module.exports = {
  name: 'ban',
  description: 'Ban a user',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, { text: 'Ban command ready.' });
  }
};
