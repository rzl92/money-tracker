import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('Export', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/export')
  })

  test('halaman export tampil dengan benar', async ({ page }) => {
    await expect(page.locator('h1:has-text("Export Laporan")')).toBeVisible()
    await expect(page.locator('text=Excel (.xlsx)')).toBeVisible()
  })

  test('selector periode tersedia', async ({ page }) => {
    const select = page.locator('[data-slot="select-trigger"]')
    await expect(select).toBeVisible()
  })

  test('tombol unduh tersedia', async ({ page }) => {
    await expect(page.locator('button:has-text("Unduh Excel")')).toBeVisible()
  })

  test('info konten yang akan diunduh ditampilkan', async ({ page }) => {
    await expect(page.locator('text=Sheet Transaksi')).toBeVisible()
    await expect(page.locator('text=Sheet Ringkasan')).toBeVisible()
  })

  test('download Excel berhasil (API mengembalikan file)', async ({ page, request }) => {
    // Test via API langsung
    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ')

    const month = new Date().toISOString().slice(0, 7) // YYYY-MM
    const response = await request.get(`/api/export?month=${month}`, {
      headers: { Cookie: cookieHeader },
    })

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    expect(response.headers()['content-disposition']).toContain('.xlsx')
  })

  test('download tanpa filter (semua waktu) berhasil', async ({ page, request }) => {
    const cookies = await page.context().cookies()
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ')

    const response = await request.get('/api/export', {
      headers: { Cookie: cookieHeader },
    })

    expect(response.status()).toBe(200)
  })
})
