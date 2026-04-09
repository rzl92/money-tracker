import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('API - Categories CRUD', () => {
  let cookies: string
  let categoryId: string

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await login(page)
    const c = await page.context().cookies()
    cookies = c.map(c => `${c.name}=${c.value}`).join('; ')
    await page.close()
  })

  test('GET /api/categories → 200 dengan array', async ({ request }) => {
    const res = await request.get('/api/categories', { headers: { Cookie: cookies } })
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    // Kategori default dari trigger sudah ada
    expect(data.length).toBeGreaterThan(0)
  })

  test('POST /api/categories → 201 buat kategori baru', async ({ request }) => {
    const res = await request.post('/api/categories', {
      headers: { Cookie: cookies, 'Content-Type': 'application/json' },
      data: { name: 'API Test Kategori', icon: '🧪', color: '#ff0000', type: 'expense' },
    })
    expect(res.status()).toBe(201)
    const data = await res.json()
    expect(data.name).toBe('API Test Kategori')
    expect(data.id).toBeTruthy()
    categoryId = data.id
  })

  test('PUT /api/categories → 200 update kategori', async ({ request }) => {
    const res = await request.put('/api/categories', {
      headers: { Cookie: cookies, 'Content-Type': 'application/json' },
      data: { id: categoryId, name: 'API Test Kategori Updated', icon: '✅', color: '#00ff00', type: 'both' },
    })
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(data.name).toBe('API Test Kategori Updated')
  })

  test('DELETE /api/categories → 200 hapus kategori', async ({ request }) => {
    const res = await request.delete(`/api/categories?id=${categoryId}`, {
      headers: { Cookie: cookies },
    })
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  test('POST /api/categories tanpa nama → 400', async ({ request }) => {
    const res = await request.post('/api/categories', {
      headers: { Cookie: cookies, 'Content-Type': 'application/json' },
      data: { icon: '🧪', color: '#ff0000' },
    })
    expect(res.status()).toBe(400)
  })
})

test.describe('API - Transactions CRUD', () => {
  let cookies: string
  let txId: string

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    await login(page)
    const c = await page.context().cookies()
    cookies = c.map(c => `${c.name}=${c.value}`).join('; ')
    await page.close()
  })

  test('GET /api/transactions → 200 dengan array', async ({ request }) => {
    const res = await request.get('/api/transactions', { headers: { Cookie: cookies } })
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
  })

  test('POST /api/transactions → 201 buat transaksi', async ({ request }) => {
    const res = await request.post('/api/transactions', {
      headers: { Cookie: cookies, 'Content-Type': 'application/json' },
      data: {
        type: 'expense',
        amount: 50000,
        description: 'API Test Transaction',
        date: new Date().toISOString().split('T')[0],
      },
    })
    expect(res.status()).toBe(201)
    const data = await res.json()
    expect(data.amount).toBe(50000)
    expect(data.type).toBe('expense')
    txId = data.id
  })

  test('GET /api/transactions filter bulan → hanya data bulan itu', async ({ request }) => {
    const month = new Date().toISOString().slice(0, 7)
    const res = await request.get(`/api/transactions?month=${month}`, {
      headers: { Cookie: cookies },
    })
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    // Semua transaksi harus di bulan ini
    data.forEach((tx: { date: string }) => {
      expect(tx.date.startsWith(month)).toBe(true)
    })
  })

  test('GET /api/transactions filter type=expense', async ({ request }) => {
    const res = await request.get('/api/transactions?type=expense', {
      headers: { Cookie: cookies },
    })
    expect(res.status()).toBe(200)
    const data = await res.json()
    data.forEach((tx: { type: string }) => {
      expect(tx.type).toBe('expense')
    })
  })

  test('PUT /api/transactions → 200 update transaksi', async ({ request }) => {
    const res = await request.put('/api/transactions', {
      headers: { Cookie: cookies, 'Content-Type': 'application/json' },
      data: {
        id: txId,
        type: 'expense',
        amount: 75000,
        description: 'API Test Transaction Updated',
        date: new Date().toISOString().split('T')[0],
      },
    })
    expect(res.status()).toBe(200)
    const data = await res.json()
    expect(data.amount).toBe(75000)
  })

  test('DELETE /api/transactions → 200 hapus transaksi', async ({ request }) => {
    const res = await request.delete(`/api/transactions?id=${txId}`, {
      headers: { Cookie: cookies },
    })
    expect(res.status()).toBe(200)
  })

  test('POST /api/transactions tanpa type → 400', async ({ request }) => {
    const res = await request.post('/api/transactions', {
      headers: { Cookie: cookies, 'Content-Type': 'application/json' },
      data: { amount: 50000 },
    })
    expect(res.status()).toBe(400)
  })
})
