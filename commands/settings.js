module.exports = {
  name: 'groupmanage',
  description: 'Group management',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, { text: 'Group management command ready.' });
  }
};
