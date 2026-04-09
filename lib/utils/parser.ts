export interface ParsedTransaction {
  type: 'income' | 'expense'
  amount: number
  description: string
}

const INCOME_KEYWORDS = [
  'pemasukan', 'masuk', 'gaji', 'income', 'terima', 'dapat',
  'pendapatan', 'bayaran', 'transfer masuk', 'bonus', 'dividen',
]

// Parse angka dari berbagai format bahasa Indonesia
function parseAmount(text: string): number {
  // Normalisasi
  let t = text.toLowerCase().trim()

  // Tangani format seperti "2jt", "2 juta", "500rb", "500 ribu"
  t = t.replace(/(\d+(?:[.,]\d+)?)\s*jt\b/g, (_, n) =>
    String(parseFloat(n.replace(',', '.')) * 1_000_000)
  )
  t = t.replace(/(\d+(?:[.,]\d+)?)\s*juta\b/g, (_, n) =>
    String(parseFloat(n.replace(',', '.')) * 1_000_000)
  )
  t = t.replace(/(\d+(?:[.,]\d+)?)\s*rb\b/g, (_, n) =>
    String(parseFloat(n.replace(',', '.')) * 1_000)
  )
  t = t.replace(/(\d+(?:[.,]\d+)?)\s*ribu\b/g, (_, n) =>
    String(parseFloat(n.replace(',', '.')) * 1_000)
  )

  // Cari angka
  const match = t.match(/\d[\d.,]*/
  )
  if (!match) return 0

  // Bersihkan separator ribuan
  const cleaned = match[0].replace(/\./g, '').replace(',', '.')
  return Math.round(parseFloat(cleaned))
}

export function parseTransactionMessage(message: string): ParsedTransaction | null {
  const lower = message.toLowerCase().trim()

  // Cek apakah pemasukan
  const isIncome = INCOME_KEYWORDS.some(k => lower.includes(k))

  // Parse jumlah
  const amount = parseAmount(lower)
  if (amount <= 0) return null

  // Bersihkan deskripsi: hapus jumlah dan keyword pemasukan
  let description = message
    .replace(/\d+(?:[.,]\d+)?(?:\s*(?:jt|juta|rb|ribu))?/gi, '')
    .replace(new RegExp(INCOME_KEYWORDS.join('|'), 'gi'), '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!description) {
    description = isIncome ? 'Pemasukan' : 'Pengeluaran'
  }

  // Capitalize first letter
  description = description.charAt(0).toUpperCase() + description.slice(1)

  return {
    type: isIncome ? 'income' : 'expense',
    amount,
    description,
  }
}
