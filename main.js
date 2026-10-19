const fs = require('fs');
const path = require('path');

function ensureDataFile(fileName, defaultContent) {
  const dir = path.join(__dirname, 'data');
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, fileName);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2));
  }
  return filePath;
}

ensureDataFile('config.json', {
  botName: 'ADEZ-XMD',
  ownerNumber: '',
  prefix: '.',
  publicMode: true
});

ensureDataFile('userGroupData.json', {
  antibadword: {},
  antilink: {},
  welcome: {},
  goodbye: {},
  chatbot: {},
  warnings: {},
  sudo: []
});

module.exports = {
  ensureDataFile
};
