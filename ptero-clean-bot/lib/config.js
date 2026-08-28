function parseIdList(str, fallback = []) {
  if (!str) return fallback;
  return str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => parseInt(s, 10))
    .filter((n) => !Number.isNaN(n));
}

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || '',
  // Telegram user ID yang boleh pakai bot (WAJIB diisi)
  ADMIN_IDS: parseIdList(process.env.ADMIN_IDS, []),
  // ID server Pterodactyl yang TIDAK BOLEH ikut dibersihkan (default: 1)
  PROTECTED_SERVER_IDS: parseIdList(process.env.PROTECTED_SERVER_IDS, [1]),
};
