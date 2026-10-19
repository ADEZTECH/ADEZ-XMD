module.exports = {
  name: 'tagall',
  description: 'Tag everyone in a group',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, { text: 'Tag all feature active in group mode.' });
  }
};
