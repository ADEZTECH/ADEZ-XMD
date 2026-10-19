/**
* ADEZ-XMD
* ADEZ Tech
*/

const settings = {
  packname: 'ADEZ-XMD',
  author: 'ADEZ TECH',
  botName: "ADEZ-XMD",
  botOwner: 'ADEZ TECH', // Your name
  // Set your number without + symbol: country code + number, no spaces (e.g. 2547XXXXXXXX).
  // Best practice: set OWNER_NUMBER in your .env or host config instead of editing this line.
  ownerNumber: process.env.OWNER_NUMBER || '254XXXXXXXXX',
  giphyApiKey: '',
  commandMode: "public",
  maxStoreMessages: 20,
  storeWriteInterval: 10000,
  description: "This is a bot for managing group commands and automating tasks.",
  version: "2.7.6",
  updateBranch: 'main',
  updateZipToken: '',
  updateZipUrl: '',
  timezone: 'Africa/Nairobi',
};

module.exports = settings;
