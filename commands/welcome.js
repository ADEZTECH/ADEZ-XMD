module.exports = {
  name: 'aiGpt4',
  description: 'AI GPT-4 command stub',
  run: async ({ sock, sender }) => {
    await sock.sendMessage(sender, { text: 'ADEZ-XMD AI GPT-4 command connected.' });
  }
};
