module.exports = {
  name: 'alive',
  description: 'Bot alive check',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, { text: 'ADEZ-XMD is alive ✅' });
  }
};
