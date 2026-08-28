// Jalankan: BOT_TOKEN=xxx VERCEL_URL=https://project-kamu.vercel.app WEBHOOK_SECRET=xxx node scripts/set-webhook.js
const https = require('https');

const BOT_TOKEN = process.env.BOT_TOKEN;
const VERCEL_URL = process.env.VERCEL_URL; // contoh: https://ptero-clean-bot.vercel.app
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

if (!BOT_TOKEN || !VERCEL_URL) {
  console.error('Set env BOT_TOKEN dan VERCEL_URL dulu sebelum jalankan script ini.');
  process.exit(1);
}

const webhookUrl = `${VERCEL_URL.replace(/\/+$/, '')}/api/bot`;
const params = new URLSearchParams({ url: webhookUrl });
if (WEBHOOK_SECRET) params.set('secret_token', WEBHOOK_SECRET);

https
  .get(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?${params.toString()}`, (res) => {
    let data = '';
    res.on('data', (c) => (data += c));
    res.on('end', () => {
      console.log('Response Telegram:', data);
    });
  })
  .on('error', (e) => console.error('Error:', e.message));
