module.exports = {
  name: 'help',
  description: 'Show ADEZ-XMD command help',
  run: async ({ sock, sender, commandNames }) => {
    const text = [
      'ADEZ-XMD Help',
      'Examples: .menu .help .ping .owner .alive .play .uptime',
      `Available commands: ${(commandNames || []).slice(0, 30).join(', ')}`
    ].join('\n');

    await sock.sendMessage(sender, { text });
  }
};
