/**
 * Test API endpoints (smoke test - tanpa auth)
 * Memastikan semua endpoint merespons dengan benar
 */

const BASE_URL = 'http://localhost:3000'

async function get(path: string) {
  const res = await fetch(`${BASE_URL}${path}`)
  return { status: res.status, body: await res.json().catch(() => null) }
}

describe('API Endpoints - Unauthorized (tanpa login)', () => {
  test('GET /api/transactions → 401', async () => {
    const { status } = await get('/api/transactions')
    expect(status).toBe(401)
  })

  test('GET /api/categories → 401', async () => {
    const { status } = await get('/api/categories')
    expect(status).toBe(401)
  })

  test('GET /api/export → 401', async () => {
    const { status } = await get('/api/export')
    expect(status).toBe(401)
  })

  test('GET /api/telegram/link-token → 401', async () => {
    const { status } = await get('/api/telegram/link-token')
    expect(status).toBe(401)
  })
})

describe('Halaman Web - Redirect ke login', () => {
  test('GET / → redirect ke /login', async () => {
    const res = await fetch(`${BASE_URL}/`, { redirect: 'manual' })
    expect([301, 302, 307, 308]).toContain(res.status)
  })

  test('GET /transactions → redirect ke /login', async () => {
    const res = await fetch(`${BASE_URL}/transactions`, { redirect: 'manual' })
    expect([301, 302, 307, 308]).toContain(res.status)
  })

  test('GET /login → 200 (halaman login accessible)', async () => {
    const res = await fetch(`${BASE_URL}/login`)
    expect(res.status).toBe(200)
  })

  test('GET /register → 200 (halaman register accessible)', async () => {
    const res = await fetch(`${BASE_URL}/register`)
    expect(res.status).toBe(200)
  })
})
