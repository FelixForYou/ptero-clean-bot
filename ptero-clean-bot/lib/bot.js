const { Telegraf, Markup } = require('telegraf');
const ptla = require('./pterodactyl');
const { BOT_TOKEN, ADMIN_IDS, PROTECTED_SERVER_IDS } = require('./config');

if (!BOT_TOKEN) {
  throw new Error('BOT_TOKEN belum di-set di environment variables');
}

const bot = new Telegraf(BOT_TOKEN);

// ---------- Helper ----------
function isAdmin(ctx) {
  const id = ctx.from?.id;
  if (!ADMIN_IDS.includes(id)) {
    ctx.reply('🚫 Kamu tidak punya akses untuk pakai bot ini.').catch(() => {});
    return false;
  }
  return true;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function replyLong(ctx, text) {
  const parts = chunk(text, 3500);
  for (const p of parts) {
    // eslint-disable-next-line no-await-in-loop
    await ctx.reply(p);
  }
}

// ---------- Commands ----------
bot.start((ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.reply(
    '👋 Halo! Bot manajemen Pterodactyl siap dipakai.\n\nKetik /help untuk lihat semua perintah.'
  );
});

bot.help((ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.replyWithMarkdown(
    [
      '*📋 Daftar Perintah*',
      '',
      '*Server*',
      '/listserver — daftar semua server',
      '/serverinfo <id> — detail 1 server',
      '/suspend <id> — suspend server',
      '/unsuspend <id> — unsuspend server',
      '/reinstall <id> — reinstall server',
      '',
      '*Pembersihan*',
      '/cleanserver — hapus SEMUA server kecuali yang dilindungi (butuh konfirmasi)',
      '/protected — lihat daftar ID server yang dilindungi',
      '',
      '*Info Panel*',
      '/stats — ringkasan jumlah server/node/user',
      '/nodes — daftar node & kapasitas',
      '/whoami — cek Telegram ID kamu',
    ].join('\n')
  );
});

bot.command('whoami', (ctx) => {
  ctx.reply(`🆔 Telegram ID kamu: ${ctx.from.id}`);
});

bot.command('protected', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.reply(`🛡️ Server ID yang dilindungi (tidak akan dihapus):\n${PROTECTED_SERVER_IDS.join(', ')}`);
});

bot.command('listserver', async (ctx) => {
  if (!isAdmin(ctx)) return;
  try {
    await ctx.reply('⏳ Mengambil daftar server...');
    const servers = await ptla.getAllServers();
    if (servers.length === 0) return ctx.reply('Tidak ada server di panel.');
    const lines = servers.map((s) => {
      const a = s.attributes;
      const protectedMark = PROTECTED_SERVER_IDS.includes(a.id) ? ' 🛡️' : '';
      const suspendMark = a.suspended ? ' ⛔suspended' : '';
      return `#${a.id} — ${a.name} (${a.identifier})${protectedMark}${suspendMark}`;
    });
    await replyLong(ctx, `📦 Total ${servers.length} server:\n\n${lines.join('\n')}`);
  } catch (err) {
    console.error(err.response?.data || err.message);
    ctx.reply('❌ Gagal ambil daftar server. Cek PTLA_URL / PTLA_KEY.');
  }
});

bot.command('serverinfo', async (ctx) => {
  if (!isAdmin(ctx)) return;
  const id = ctx.message.text.split(' ')[1];
  if (!id) return ctx.reply('Format: /serverinfo <id>');
  try {
    const s = await ptla.getServer(id);
    const a = s.attributes;
    ctx.replyWithMarkdown(
      [
        `*Server #${a.id} — ${a.name}*`,
        `Identifier: \`${a.identifier}\``,
        `UUID: \`${a.uuid}\``,
        `Suspended: ${a.suspended ? 'Ya ⛔' : 'Tidak ✅'}`,
        `Node ID: ${a.node}`,
        `Limits: ${a.limits.memory}MB RAM / ${a.limits.disk}MB Disk / ${a.limits.cpu}% CPU`,
        `Protected: ${PROTECTED_SERVER_IDS.includes(a.id) ? 'Ya 🛡️' : 'Tidak'}`,
      ].join('\n')
    );
  } catch (err) {
    ctx.reply('❌ Server tidak ditemukan atau gagal ambil data.');
  }
});

bot.command('suspend', async (ctx) => {
  if (!isAdmin(ctx)) return;
  const id = ctx.message.text.split(' ')[1];
  if (!id) return ctx.reply('Format: /suspend <id>');
  try {
    await ptla.suspendServer(id);
    ctx.reply(`⛔ Server #${id} berhasil di-suspend.`);
  } catch (err) {
    ctx.reply('❌ Gagal suspend server.');
  }
});

bot.command('unsuspend', async (ctx) => {
  if (!isAdmin(ctx)) return;
  const id = ctx.message.text.split(' ')[1];
  if (!id) return ctx.reply('Format: /unsuspend <id>');
  try {
    await ptla.unsuspendServer(id);
    ctx.reply(`✅ Server #${id} berhasil di-unsuspend.`);
  } catch (err) {
    ctx.reply('❌ Gagal unsuspend server.');
  }
});

bot.command('reinstall', async (ctx) => {
  if (!isAdmin(ctx)) return;
  const id = ctx.message.text.split(' ')[1];
  if (!id) return ctx.reply('Format: /reinstall <id>');
  try {
    await ptla.reinstallServer(id);
    ctx.reply(`🔄 Reinstall server #${id} sudah di-trigger.`);
  } catch (err) {
    ctx.reply('❌ Gagal reinstall server.');
  }
});

bot.command('nodes', async (ctx) => {
  if (!isAdmin(ctx)) return;
  try {
    const nodes = await ptla.getNodes();
    const lines = nodes.map((n) => {
      const a = n.attributes;
      return `#${a.id} — ${a.name} | RAM ${a.memory}MB | Disk ${a.disk}MB | Maintenance: ${a.maintenance_mode ? 'Ya' : 'Tidak'}`;
    });
    await replyLong(ctx, `🖥️ Nodes:\n\n${lines.join('\n')}`);
  } catch (err) {
    ctx.reply('❌ Gagal ambil daftar node.');
  }
});

bot.command('stats', async (ctx) => {
  if (!isAdmin(ctx)) return;
  try {
    await ctx.reply('⏳ Menghitung statistik...');
    const [servers, nodes, users] = await Promise.all([
      ptla.getAllServers(),
      ptla.getNodes(),
      ptla.getUsers(),
    ]);
    const suspended = servers.filter((s) => s.attributes.suspended).length;
    ctx.replyWithMarkdown(
      [
        '*📊 Statistik Panel*',
        `Total server: ${servers.length}`,
        `Server suspended: ${suspended}`,
        `Total node: ${nodes.length}`,
        `Total user: ${users.length}`,
        `Server dilindungi: ${PROTECTED_SERVER_IDS.join(', ')}`,
      ].join('\n')
    );
  } catch (err) {
    ctx.reply('❌ Gagal ambil statistik.');
  }
});

// ---------- CLEAN SERVER (destructive - pakai konfirmasi) ----------
bot.command('cleanserver', async (ctx) => {
  if (!isAdmin(ctx)) return;
  try {
    await ctx.reply('⏳ Mengambil daftar server...');
    const servers = await ptla.getAllServers();
    const targets = servers.filter((s) => !PROTECTED_SERVER_IDS.includes(s.attributes.id));

    if (targets.length === 0) {
      return ctx.reply('✅ Tidak ada server yang perlu dibersihkan (semua terlindungi atau kosong).');
    }

    const preview = targets
      .slice(0, 30)
      .map((s) => `#${s.attributes.id} — ${s.attributes.name}`)
      .join('\n');
    const more = targets.length > 30 ? `\n...dan ${targets.length - 30} server lainnya` : '';

    await ctx.reply(
      `⚠️ *PERINGATAN*\nBot akan menghapus *${targets.length} server* berikut secara PERMANEN.\nServer dengan ID ${PROTECTED_SERVER_IDS.join(', ')} akan DILEWATI (dilindungi).\n\n${preview}${more}\n\nLanjutkan?`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          Markup.button.callback('✅ Ya, hapus semua', 'clean_confirm'),
          Markup.button.callback('❌ Batal', 'clean_cancel'),
        ]),
      }
    );
  } catch (err) {
    console.error(err.response?.data || err.message);
    ctx.reply('❌ Gagal ambil daftar server untuk dibersihkan.');
  }
});

bot.action('clean_cancel', async (ctx) => {
  await ctx.answerCbQuery('Dibatalkan');
  await ctx.editMessageText('❌ Pembersihan dibatalkan. Tidak ada server yang dihapus.');
});

bot.action('clean_confirm', async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) {
    return ctx.answerCbQuery('Bukan admin', { show_alert: true });
  }
  await ctx.answerCbQuery();
  await ctx.editMessageText('🧹 Sedang membersihkan server, mohon tunggu...');

  try {
    // Re-fetch supaya data terbaru (bukan pakai list lama dari sebelum konfirmasi)
    const servers = await ptla.getAllServers();
    const targets = servers.filter((s) => !PROTECTED_SERVER_IDS.includes(s.attributes.id));

    let success = 0;
    let failed = 0;
    const failedList = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const s of targets) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await ptla.deleteServer(s.attributes.id);
        success += 1;
      } catch (e) {
        failed += 1;
        failedList.push(`#${s.attributes.id} (${s.attributes.name})`);
      }
    }

    let resultMsg = `✅ Pembersihan selesai.\nBerhasil dihapus: ${success}\nGagal: ${failed}\nDilindungi (dilewati): ${PROTECTED_SERVER_IDS.join(', ')}`;
    if (failedList.length) {
      resultMsg += `\n\nGagal hapus:\n${failedList.slice(0, 20).join('\n')}`;
    }
    await ctx.reply(resultMsg);
  } catch (err) {
    console.error(err.response?.data || err.message);
    await ctx.reply('❌ Terjadi error saat proses pembersihan.');
  }
});

// Fallback untuk pesan yang bukan command
bot.on('text', (ctx) => {
  if (!isAdmin(ctx)) return;
  ctx.reply('Perintah tidak dikenal. Ketik /help untuk lihat daftar perintah.');
});

module.exports = bot;
