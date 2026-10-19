module.exports = {
  name: 'play',
  description: 'Play a basic bot response',
  run: async ({ sock, sender, args }) => {
    const query = (args || []).join(' ').trim();
    await sock.sendMessage(sender, {
      text: query
        ? `🎵 Play request: ${query}\n🚀 ADEZ-XMD is ready to process it.`
        : '🎵 ADEZ-XMD Play mode is ready. Send a song or media request after the command.'
    });
  }
};
