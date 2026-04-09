import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') // YYYY-MM

  let query = supabase
    .from('transactions')
    .select(`*, category:categories(name, icon)`)
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (month) {
    const year = parseInt(month.split('-')[0])
    const mon = parseInt(month.split('-')[1])
    const start = `${month}-01`
    const end = new Date(year, mon, 0).toISOString().split('T')[0]
    query = query.gte('date', start).lte('date', end)
  }

  const { data: transactions, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Build Excel rows
  const rows = (transactions || []).map(tx => ({
    'Tanggal': format(new Date(tx.date), 'dd/MM/yyyy'),
    'Jenis': tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    'Kategori': tx.category ? `${tx.category.icon} ${tx.category.name}` : '-',
    'Keterangan': tx.description || '-',
    'Jumlah (Rp)': tx.amount,
    'Sumber': tx.source === 'telegram' ? 'Telegram' : 'Web',
  }))

  // Summary rows
  const totalIncome = (transactions || []).filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = (transactions || []).filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const wb = XLSX.utils.book_new()

  // Sheet 1: Transactions
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [
    { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 30 }, { wch: 18 }, { wch: 10 }
  ]
  XLSX.utils.book_append_sheet(wb, ws, 'Transaksi')

  // Sheet 2: Summary
  const summaryData = [
    { 'Keterangan': 'Total Pemasukan', 'Jumlah (Rp)': totalIncome },
    { 'Keterangan': 'Total Pengeluaran', 'Jumlah (Rp)': totalExpense },
    { 'Keterangan': 'Selisih / Saldo', 'Jumlah (Rp)': totalIncome - totalExpense },
  ]
  const wsSummary = XLSX.utils.json_to_sheet(summaryData)
  wsSummary['!cols'] = [{ wch: 25 }, { wch: 18 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const periodLabel = month
    ? format(new Date(`${month}-01`), 'MMMM-yyyy', { locale: localeId })
    : 'semua'
  const filename = `catatan-keuangan-${periodLabel}.xlsx`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
