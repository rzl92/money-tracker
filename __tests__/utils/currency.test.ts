import { formatRupiah, formatRupiahShort, parseRupiah } from '@/lib/utils/currency'

describe('formatRupiah', () => {
  test('format angka biasa', () => {
    expect(formatRupiah(50000)).toBe('Rp\u00a050.000')
  })
  test('format nol', () => {
    expect(formatRupiah(0)).toBe('Rp\u00a00')
  })
  test('format jutaan', () => {
    expect(formatRupiah(5000000)).toBe('Rp\u00a05.000.000')
  })
  test('format miliaran', () => {
    expect(formatRupiah(1000000000)).toBe('Rp\u00a01.000.000.000')
  })
})

describe('formatRupiahShort', () => {
  test('di bawah 1000', () => {
    expect(formatRupiahShort(500)).toBe('Rp 500')
  })
  test('ribuan', () => {
    expect(formatRupiahShort(35000)).toBe('Rp 35rb')
  })
  test('jutaan', () => {
    expect(formatRupiahShort(5000000)).toBe('Rp 5.0jt')
  })
  test('miliaran', () => {
    expect(formatRupiahShort(2000000000)).toBe('Rp 2.0M')
  })
})

describe('parseRupiah', () => {
  test('parse angka biasa', () => {
    expect(parseRupiah('50000')).toBe(50000)
  })
  test('parse dengan titik', () => {
    expect(parseRupiah('50.000')).toBe(50000)
  })
  test('parse string kosong', () => {
    expect(parseRupiah('')).toBe(0)
  })
  test('parse dengan prefix Rp', () => {
    expect(parseRupiah('Rp 50.000')).toBe(50000)
  })
})
