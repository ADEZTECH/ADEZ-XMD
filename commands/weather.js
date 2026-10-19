module.exports = {
  name: 'owner',
  description: 'Show owner info',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, { text: 'ADEZ-XMD powered by ADEZTECH' });
  }
};
