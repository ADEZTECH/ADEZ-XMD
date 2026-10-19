module.exports = {
  name: 'owner',
  description: 'Show owner information',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, {
      text: [
        'ADEZ-XMD Owner',
        'Owner: Arnold Adez',
        'Bot: ADEZ-XMD',
        'Status: Online ✅'
      ].join('\n')
    });
  }
};
