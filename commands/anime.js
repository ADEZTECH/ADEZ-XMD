module.exports = {
  name: 'alwaysonline',
  description: 'Always online mode',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, { text: 'Always online mode configured.' });
  }
};
