module.exports = {
  name: 'ai',
  description: 'AI assistant stub',
  run: async ({ sock, sender, args }) => {
    const prompt = args.join(' ') || 'Hello';
    await sock.sendMessage(sender, { text: `ADEZ AI stub: ${prompt}` });
  }
};
