module.exports = {
  name: 'uptime',
  description: 'Show bot uptime',
  run: async ({ sock, sender }) => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    await sock.sendMessage(sender, {
      text: `⏱️ ADEZ-XMD uptime: ${hours}h ${minutes}m ${seconds}s`
    });
  }
};
