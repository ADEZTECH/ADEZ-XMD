module.exports = {
  name: 'menu',
  description: 'Show bot menu',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, {
      text: [
        'ADEZ-XMD Menu',
        '• .help',
        '• .ping',
        '• .owner',
        '• .alive',
        '• .menu',
        '• .play',
        '• .uptime',
        '• .weather'
      ].join('\n')
    });
  }
};
