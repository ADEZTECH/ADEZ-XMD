module.exports = {
  name: 'weather',
  description: 'Weather information (demo)',
  run: async ({ sock, sender, args }) => {
    const city = args.join(' ') || 'Nairobi';
    await sock.sendMessage(sender, { text: `Weather for ${city}: Demo mode active. Connect a weather API to enable live data.` });
  }
};
