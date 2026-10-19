module.exports = {
  name: 'groupinfo',
  description: 'Group info',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, { text: 'Group info command ready.' });
  }
};
