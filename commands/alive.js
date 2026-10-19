module.exports = {
  name: 'alive',
  description: 'Check if bot is alive',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, {
      text: '✅ ADEZ-XMD is alive and working!'
    });
  }
};
