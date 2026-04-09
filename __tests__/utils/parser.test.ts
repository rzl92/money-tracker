import { parseTransactionMessage } from '@/lib/utils/parser'

describe('parseTransactionMessage - Pengeluaran', () => {
  test('format dasar', () => {
    const result = parseTransactionMessage('makan siang 35000')
    expect(result).not.toBeNull()
    expect(result!.type).toBe('expense')
    expect(result!.amount).toBe(35000)
    expect(result!.description.toLowerCase()).toContain('makan siang')
  })

  test('format ribuan rb', () => {
    const result = parseTransactionMessage('transport 15rb')
    expect(result).not.toBeNull()
    expect(result!.type).toBe('expense')
    expect(result!.amount).toBe(15000)
  })

  test('format ribuan ribu', () => {
    const result = parseTransactionMessage('kopi 25ribu')
    expect(result).not.toBeNull()
    expect(result!.amount).toBe(25000)
  })

  test('format jutaan jt', () => {
    const result = parseTransactionMessage('belanja 1jt')
    expect(result).not.toBeNull()
    expect(result!.amount).toBe(1000000)
  })

  test('format jutaan juta', () => {
    const result = parseTransactionMessage('belanja 2juta')
    expect(result).not.toBeNull()
    expect(result!.amount).toBe(2000000)
  })

  test('format desimal jutaan', () => {
    const result = parseTransactionMessage('belanja 1.5jt')
    expect(result).not.toBeNull()
    expect(result!.amount).toBe(1500000)
  })
})

describe('parseTransactionMessage - Pemasukan', () => {
  test('keyword gaji', () => {
    const result = parseTransactionMessage('gaji 5000000')
    expect(result).not.toBeNull()
    expect(result!.type).toBe('income')
    expect(result!.amount).toBe(5000000)
  })

  test('keyword pemasukan', () => {
    const result = parseTransactionMessage('pemasukan freelance 2jt')
    expect(result).not.toBeNull()
    expect(result!.type).toBe('income')
    expect(result!.amount).toBe(2000000)
  })

  test('keyword dapat', () => {
    const result = parseTransactionMessage('dapat bonus 500rb')
    expect(result).not.toBeNull()
    expect(result!.type).toBe('income')
    expect(result!.amount).toBe(500000)
  })

  test('keyword income', () => {
    const result = parseTransactionMessage('income 3000000')
    expect(result).not.toBeNull()
    expect(result!.type).toBe('income')
  })
})

describe('parseTransactionMessage - Edge Cases', () => {
  test('pesan tanpa angka return null', () => {
    const result = parseTransactionMessage('halo apa kabar')
    expect(result).toBeNull()
  })

  test('jumlah nol return null', () => {
    const result = parseTransactionMessage('makan 0')
    expect(result).toBeNull()
  })

  test('angka besar jutaan', () => {
    const result = parseTransactionMessage('gaji 10jt')
    expect(result).not.toBeNull()
    expect(result!.amount).toBe(10000000)
  })

  test('deskripsi di-capitalize', () => {
    const result = parseTransactionMessage('makan siang nasi goreng 25000')
    expect(result).not.toBeNull()
    const firstChar = result!.description.charAt(0)
    expect(firstChar).toBe(firstChar.toUpperCase())
  })
})
