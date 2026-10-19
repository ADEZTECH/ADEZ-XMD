const fs = require('fs');
const path = require('path');

const commandNames = [
  'add','ai','aiGpt4','ai-bird','ai-blackbox','ai-copilot','ai-ilama','ai-meta','ai-mistral','ai-perplexity','ai-speechwriter',
  'alive','alwaysonline','anime','antibadword','antibot','anticall','antidelete','antidemote','antiedit','antiimage','antilink','antimention',
  'antipromote','antisticker','antitag','apk','approve','attp','autoboth','autofont','autoread','autorecord','autorecording','autostatus',
  'autotyping','ban','blockAndUnblock','blockUnblock','botinfo','chanel','character','chatbot','clear','clearsession','cleartmp','compliment',
  'connect4','creategroup','dare','deepseek','delete','demote','devReact','disp','eightball','emojimix','encrypt','facebook','fact','fancy',
  'fetch','flirt','getcmd','getpp','gif','gitclone','github','goodbye','goodnight','gptedit','grok','groupinfo','groupmanage','hangman',
  'heelp','help','hidetag','igs','image','imagine','img-blur','inspect','instagram','insult','join','joke','kick','kickAll','lastseen','leave',
  'location','lyrics','magicstudio','meme','mention','menu','menuConfig','menuSettings','menuimage','metaai','mf','misc','movie','movies','mute',
  'news','online','owner','pair','pies','ping','pinterest','play','pmblocker','promote','quote','remini','removebg','resetlink','restart','roseday',
  'saveStatus','scramble','setGroupStatus','setbio','setowner','setpp','setprefix','settimezone','settings','shayari','shazam','ship','simage',
  'simage-alt','simp','smeme','song','sora','sport1','sports','spotify','ss','staff','sticker','sticker-alt','stickercrop','stickertelegram',
  'stupid','sudo','tag','tagall','tagnotadmin','take','terabox','textmaker','tictactoe','tiktok','time','toAudio','topmembers','tostatus',
  'tovoiceNote','transcribe','translate','trim','trivia','truth','tts','unban','unmute','update','url','vcf','video','viewonce','vision','vv2',
  'warn','warnings','wasted','weather','welcoe','welcome','wormgpt','xvdl','ytdl','ytdocplay','ytdocvideo','yts'
];

const commands = {};

for (const name of commandNames) {
  try {
    commands[name] = require(`./${name}`);
  } catch (err) {
    commands[name] = {
      run: async ({ sock, sender }) => {
        await sock.sendMessage(sender, { text: `⚠️ ${name} command is available in the BONY-XMD structure, but not yet fully implemented in ADEZ-XMD.` });
      }
    };
  }
}

commands.help = require('./help');

module.exports = { commandNames, commands };
