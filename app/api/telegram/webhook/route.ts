import { NextRequest, NextResponse } from 'next/server'
import { Bot, webhookCallback } from 'grammy'
import { createClient } from '@supabase/supabase-js'
import { parseTransactionMessage } from '@/lib/utils/parser'
import { formatRupiah } from '@/lib/utils/currency'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  console.warn('TELEGRAM_BOT_TOKEN not set')
}

const bot = token ? new Bot(token) : null

// Gunakan service role untuk bypass RLS karena ini server-side
function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getUserByTelegramId(telegramId: number) {
  const supabase = getAdminSupabase()
  const { data } = await supabase
    .from('telegram_users')
    .select('user_id')
    .eq('telegram_id', telegramId)
    .single()
  return data?.user_id || null
}

async function getCategories(userId: string) {
  const supabase = getAdminSupabase()
  const { data } = await supabase
    .from('categories')
    .select('id, name, type')
    .eq('user_id', userId)
  return data || []
}

function matchCategory(description: string, type: string, categories: { id: string; name: string; type: string }[]) {
  const desc = description.toLowerCase()
  const filtered = categories.filter(c => c.type === type || c.type === 'both')

  // Exact or partial match
  for (const cat of filtered) {
    if (desc.includes(cat.name.toLowerCase())) return cat.id
  }

  // Common keywords
  const keywords: Record<string, string[]> = {
    'Makan & Minum': ['makan', 'minum', 'kopi', 'lunch', 'dinner', 'sarapan', 'warteg', 'resto', 'cafe'],
    'Transport': ['transport', 'ojek', 'gojek', 'grab', 'bensin', 'parkir', 'bus', 'kereta', 'mrt'],
    'Belanja': ['belanja', 'beli', 'shop', 'mall', 'marketplace', 'tokopedia', 'shopee'],
    'Hiburan': ['hiburan', 'nonton', 'bioskop', 'game', 'netflix', 'spotify'],
    'Kesehatan': ['obat', 'dokter', 'klinik', 'apotek', 'sehat'],
    'Tagihan': ['tagihan', 'listrik', 'air', 'internet', 'pulsa', 'token'],
    'Gaji': ['gaji', 'salary', 'upah'],
    'Freelance': ['freelance', 'proyek', 'project', 'klien'],
  }

  for (const [catName, kws] of Object.entries(keywords)) {
    if (kws.some(kw => desc.includes(kw))) {
      const found = filtered.find(c => c.name.toLowerCase() === catName.toLowerCase())
      if (found) return found.id
    }
  }

  return null
}

if (bot) {
  // /start
  bot.command('start', async (ctx) => {
    const telegramId = ctx.from?.id
    if (!telegramId) return

    const userId = await getUserByTelegramId(telegramId)

    if (userId) {
      await ctx.reply(
        '✅ *Akun sudah terhubung!*\n\n' +
        'Kamu bisa langsung kirim pengeluaran atau pemasukan:\n\n' +
        '💸 *Pengeluaran:* `makan siang 35000`\n' +
        '💰 *Pemasukan:* `gaji 5000000`\n\n' +
        'Perintah lain:\n' +
        '/saldo - Lihat saldo bulan ini\n' +
        '/bantuan - Daftar perintah\n' +
        '/putuskan - Putuskan koneksi akun',
        { parse_mode: 'Markdown' }
      )
    } else {
      await ctx.reply(
        '👋 *Selamat datang di Catatan Uang Bot!*\n\n' +
        'Bot ini terhubung dengan aplikasi Catatan Uang kamu.\n\n' +
        '📱 *Cara menghubungkan akun:*\n' +
        '1. Buka aplikasi web Catatan Uang\n' +
        '2. Masuk ke halaman *Pengaturan*\n' +
        '3. Klik *Hubungkan Telegram*\n' +
        '4. Salin token yang muncul\n' +
        '5. Kirim: `/link TOKEN_KAMU`\n\n' +
        'Contoh: `/link abc123def456`',
        { parse_mode: 'Markdown' }
      )
    }
  })

  // /link <token>
  bot.command('link', async (ctx) => {
    const telegramId = ctx.from?.id
    const chatId = ctx.chat.id
    if (!telegramId) return

    const token = ctx.match?.trim()
    if (!token) {
      await ctx.reply('❌ Kirim token setelah perintah.\nContoh: `/link abc123`', { parse_mode: 'Markdown' })
      return
    }

    const supabase = getAdminSupabase()

    // Verify token
    const { data: linkData } = await supabase
      .from('telegram_link_tokens')
      .select('user_id, expires_at')
      .eq('token', token)
      .single()

    if (!linkData) {
      await ctx.reply('❌ Token tidak valid. Buat token baru di halaman Pengaturan.')
      return
    }

    if (new Date(linkData.expires_at) < new Date()) {
      await ctx.reply('❌ Token sudah kedaluwarsa. Buat token baru di halaman Pengaturan.')
      return
    }

    // Link account
    await supabase
      .from('telegram_users')
      .upsert({ telegram_id: telegramId, user_id: linkData.user_id, chat_id: chatId })

    // Delete token
    await supabase.from('telegram_link_tokens').delete().eq('token', token)

    await ctx.reply(
      '🎉 *Akun berhasil dihubungkan!*\n\n' +
      'Sekarang kamu bisa catat langsung dari Telegram:\n\n' +
      '💸 `makan siang 35000`\n' +
      '💰 `gaji 5000000`\n' +
      '💸 `transport 15rb`\n' +
      '💰 `pemasukan freelance 2jt`\n\n' +
      'Ketik /bantuan untuk daftar lengkap perintah.',
      { parse_mode: 'Markdown' }
    )
  })

  // /saldo
  bot.command('saldo', async (ctx) => {
    const telegramId = ctx.from?.id
    if (!telegramId) return

    const userId = await getUserByTelegramId(telegramId)
    if (!userId) {
      await ctx.reply('❌ Akun belum terhubung. Ketik /start untuk instruksi.')
      return
    }

    const supabase = getAdminSupabase()
    const month = format(new Date(), 'yyyy-MM')
    const start = `${month}-01`
    const end = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]

    const { data: txs } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId)
      .gte('date', start)
      .lte('date', end)

    const income = (txs || []).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = (txs || []).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const balance = income - expense
    const monthLabel = format(new Date(), 'MMMM yyyy', { locale: localeId })

    await ctx.reply(
      `📊 *Ringkasan ${monthLabel}*\n\n` +
      `💰 Pemasukan: *${formatRupiah(income)}*\n` +
      `💸 Pengeluaran: *${formatRupiah(expense)}*\n` +
      `─────────────────\n` +
      `💼 Saldo: *${formatRupiah(balance)}*\n\n` +
      `${balance >= 0 ? '✨ Keuanganmu sehat!' : '⚠️ Pengeluaran melebihi pemasukan'}`,
      { parse_mode: 'Markdown' }
    )
  })

  // /bantuan
  bot.command('bantuan', async (ctx) => {
    await ctx.reply(
      '📖 *Daftar Perintah*\n\n' +
      '*Input Transaksi (ketik langsung):*\n' +
      '`makan 35000` → pengeluaran\n' +
      '`transport 15rb` → pengeluaran\n' +
      '`gaji 5000000` → pemasukan\n' +
      '`pemasukan freelance 2jt` → pemasukan\n\n' +
      '*Perintah:*\n' +
      '/saldo - Lihat saldo bulan ini\n' +
      '/bantuan - Tampilkan pesan ini\n' +
      '/putuskan - Putuskan koneksi akun\n\n' +
      '*Format angka yang didukung:*\n' +
      '`35000` `35rb` `35ribu` `2jt` `2juta`',
      { parse_mode: 'Markdown' }
    )
  })

  // /putuskan
  bot.command('putuskan', async (ctx) => {
    const telegramId = ctx.from?.id
    if (!telegramId) return

    const supabase = getAdminSupabase()
    await supabase.from('telegram_users').delete().eq('telegram_id', telegramId)

    await ctx.reply('✅ Akun berhasil diputuskan. Ketik /start untuk menghubungkan kembali.')
  })

  // Handle natural language messages
  bot.on('message:text', async (ctx) => {
    const telegramId = ctx.from?.id
    if (!telegramId) return

    const text = ctx.message.text
    if (text.startsWith('/')) return // Skip commands

    const userId = await getUserByTelegramId(telegramId)
    if (!userId) {
      await ctx.reply('❌ Akun belum terhubung. Ketik /start untuk instruksi.')
      return
    }

    const parsed = parseTransactionMessage(text)
    if (!parsed) {
      await ctx.reply(
        '❓ Tidak bisa memahami pesanmu.\n\n' +
        'Contoh format:\n' +
        '`makan siang 35000`\n' +
        '`gaji 5000000`\n' +
        '`transport 15rb`',
        { parse_mode: 'Markdown' }
      )
      return
    }

    const categories = await getCategories(userId)
    const categoryId = matchCategory(parsed.description, parsed.type, categories)

    const supabase = getAdminSupabase()
    const { data: tx, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: parsed.type,
        amount: parsed.amount,
        category_id: categoryId,
        description: parsed.description,
        date: format(new Date(), 'yyyy-MM-dd'),
        source: 'telegram',
      })
      .select('*, category:categories(name, icon)')
      .single()

    if (error) {
      await ctx.reply('❌ Gagal menyimpan transaksi. Coba lagi.')
      return
    }

    const emoji = parsed.type === 'income' ? '✅ Pemasukan' : '✅ Pengeluaran'
    const catInfo = tx.category ? `\n📂 Kategori: ${tx.category.icon} ${tx.category.name}` : ''

    await ctx.reply(
      `${emoji} *dicatat!*\n\n` +
      `💬 ${parsed.description}\n` +
      `💵 ${formatRupiah(parsed.amount)}` +
      catInfo,
      { parse_mode: 'Markdown' }
    )
  })
}

export async function POST(req: NextRequest) {
  if (!bot) {
    return NextResponse.json({ error: 'Bot not configured' }, { status: 500 })
  }

  try {
    const handler = webhookCallback(bot, 'std/http')
    return await handler(req)
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
