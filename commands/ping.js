module.exports = {
  name: 'menu',
  description: 'Show bot menu',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, {
      text: 'ADEZ-XMD Menu\n• .help\n• .ping\n• .ai\n• .owner\n• .weather\n• .menu\n• .welcome\n• .goodbye\n• .tagall'
    });
  }
};
