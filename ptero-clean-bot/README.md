# Ptero Clean Bot

Bot Telegram untuk kelola & bersihin server di panel **Pterodactyl** lewat **Application API (PTLA)**, jalan di **Vercel** pakai mode **webhook** (bukan polling, karena Vercel serverless).

## Fitur

- `/cleanserver` — hapus semua server **kecuali** ID yang dilindungi (default ID `1`). Ada konfirmasi Ya/Batal dulu sebelum eksekusi, jadi tidak sengaja kehapus.
- `/listserver` — daftar semua server + status suspend + tanda 🛡️ kalau dilindungi
- `/serverinfo <id>` — detail satu server
- `/suspend <id>` / `/unsuspend <id>` — suspend / unsuspend server
- `/reinstall <id>` — trigger reinstall server
- `/nodes` — daftar node & kapasitas
- `/stats` — ringkasan total server/node/user + jumlah yang suspended
- `/protected` — lihat ID server yang dilindungi
- `/whoami` — cek Telegram ID kamu (buat isi `ADMIN_IDS`)
- Semua command dikunci hanya untuk ID di `ADMIN_IDS`

## 1. Siapkan API Key Pterodactyl

Di panel admin: **Admin → Application API → Create New**, kasih permission minimal `read` + `write` untuk Servers (dan Nodes/Users kalau mau pakai `/nodes` `/stats`). Key diawali `ptla_`.

⚠️ Ini **bukan** Client API key (`ptlc_`) — harus Application API.

## 2. Deploy ke Vercel

```bash
npm install -g vercel
cd ptero-clean-bot
npm install
vercel
```

Ikuti prompt-nya (link/create project). Setelah selesai kamu dapat URL, misal `https://ptero-clean-bot.vercel.app`.

## 3. Set Environment Variables

Di dashboard Vercel → Project → Settings → Environment Variables, isi (lihat `.env.example`):

| Key | Contoh | Keterangan |
|---|---|---|
| `BOT_TOKEN` | `123456:ABC-DEF...` | dari @BotFather |
| `ADMIN_IDS` | `123456789` | Telegram ID kamu, pisah koma kalau banyak |
| `PTLA_URL` | `https://panel.domainkamu.com` | tanpa trailing slash |
| `PTLA_KEY` | `ptla_xxxx` | Application API key |
| `PROTECTED_SERVER_IDS` | `1` | ID server yang tidak boleh ikut dibersihkan |
| `WEBHOOK_SECRET` | string acak | opsional, buat validasi webhook |

Setelah isi env vars, redeploy: `vercel --prod`

## 4. Daftarkan Webhook ke Telegram

Jalankan dari komputer kamu (bukan di Vercel):

```bash
BOT_TOKEN=xxx VERCEL_URL=https://ptero-clean-bot.vercel.app WEBHOOK_SECRET=xxx node scripts/set-webhook.js
```

Kalau sukses, respons dari Telegram akan berisi `"ok":true`.

Untuk lepas webhook (misal mau testing lokal pakai polling):

```bash
BOT_TOKEN=xxx node scripts/delete-webhook.js
```

## 5. Test

Chat bot kamu di Telegram, kirim `/start` lalu `/whoami` untuk pastikan ID kamu cocok dengan `ADMIN_IDS`. Kalau sudah cocok, coba `/listserver` dan `/stats`.

## Catatan Keamanan

- `/cleanserver` **permanen menghapus server** — selalu ada layar konfirmasi, jangan asal klik Ya.
- Server dengan ID di `PROTECTED_SERVER_IDS` (default `1`) otomatis dilewati saat pembersihan.
- Jangan share `PTLA_KEY` atau `BOT_TOKEN` ke siapapun / commit ke git — pakai `.env` lokal (sudah di-`.gitignore`) dan Environment Variables di Vercel untuk produksi.
- Batasi `ADMIN_IDS` cuma ke ID yang benar-benar kamu percaya, karena mereka bisa hapus server lewat bot ini.

## Struktur Project

```
ptero-clean-bot/
├── api/
│   └── bot.js          # entrypoint webhook Vercel
├── lib/
│   ├── bot.js           # semua command Telegraf
│   ├── config.js        # baca env vars
│   └── pterodactyl.js   # wrapper PTLA API
├── scripts/
│   ├── set-webhook.js
│   └── delete-webhook.js
├── vercel.json
├── package.json
└── .env.example
```
