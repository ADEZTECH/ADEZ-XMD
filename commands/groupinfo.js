module.exports = {
  name: 'approve',
  description: 'Approve a user',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, { text: 'Approve command ready.' });
  }
};
