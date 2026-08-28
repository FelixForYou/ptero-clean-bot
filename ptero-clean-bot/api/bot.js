const bot = require('../lib/bot');
const { WEBHOOK_SECRET } = require('../lib/config');

module.exports = async (req, res) => {
  // Endpoint dicek manual lewat browser / uptime checker
  if (req.method !== 'POST') {
    res.status(200).send('Bot webhook aktif ✅');
    return;
  }

  // Validasi secret token dari Telegram (kalau di-set saat setWebhook)
  if (WEBHOOK_SECRET) {
    const incoming = req.headers['x-telegram-bot-api-secret-token'];
    if (incoming !== WEBHOOK_SECRET) {
      res.status(401).send('Unauthorized');
      return;
    }
  }

  try {
    await bot.handleUpdate(req.body, res);
  } catch (err) {
    console.error('Error handling update:', err);
  }

  // Telegram cuma butuh 200 OK, kalau handleUpdate belum kirim response sendiri
  if (!res.headersSent) {
    res.status(200).send('OK');
  }
};
