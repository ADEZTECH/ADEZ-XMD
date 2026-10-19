module.exports = {
  name: 'help',
  description: 'Show ADEZ-XMD command help',
  run: async ({ sock, sender, commandNames }) => {
    const text = [
      'ADEZ-XMD Help',
      'Available command set includes the BONY-XMD-inspired suite.',
      'Examples: .menu .help .ping .ai .owner .weather .tagall .welcome .goodbye',
      `Loaded commands: ${commandNames.slice(0, 25).join(', ')} ...`
    ].join('\n');
    await sock.sendMessage(sender, { text });
  }
};
