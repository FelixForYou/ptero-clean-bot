// Jalankan: BOT_TOKEN=xxx node scripts/delete-webhook.js
const https = require('https');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('Set env BOT_TOKEN dulu.');
  process.exit(1);
}

https
  .get(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`, (res) => {
    let data = '';
    res.on('data', (c) => (data += c));
    res.on('end', () => console.log('Response Telegram:', data));
  })
  .on('error', (e) => console.error('Error:', e.message));
