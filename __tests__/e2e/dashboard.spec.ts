import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('menampilkan judul bulan ini', async ({ page }) => {
    await expect(page.locator('text=Bulan ini')).toBeVisible()
  })

  test('menampilkan card saldo', async ({ page }) => {
    await expect(page.locator('text=Saldo Bulan Ini')).toBeVisible()
  })

  test('menampilkan card pemasukan', async ({ page }) => {
    await expect(page.locator('text=Pemasukan').first()).toBeVisible()
  })

  test('menampilkan card pengeluaran', async ({ page }) => {
    await expect(page.locator('text=Pengeluaran').first()).toBeVisible()
  })

  test('menampilkan section tren 6 bulan', async ({ page }) => {
    await expect(page.locator('text=Tren 6 Bulan Terakhir')).toBeVisible()
  })

  test('menampilkan section pengeluaran per kategori', async ({ page }) => {
    await expect(page.locator('text=Pengeluaran per Kategori')).toBeVisible()
  })

  test('menampilkan section transaksi terbaru', async ({ page }) => {
    await expect(page.locator('text=Transaksi Terbaru')).toBeVisible()
  })

  test('link "Lihat semua" ke halaman transaksi', async ({ page }) => {
    await page.click('text=Lihat semua')
    await expect(page).toHaveURL('/transactions')
  })
})

test.describe('Dashboard - Navigasi', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('navigasi ke Transaksi', async ({ page }) => {
    await page.click('text=Transaksi')
    await expect(page).toHaveURL('/transactions')
  })

  test('navigasi ke Kategori', async ({ page }) => {
    await page.click('text=Kategori')
    await expect(page).toHaveURL('/categories')
  })

  test('navigasi ke Export', async ({ page }) => {
    await page.click('text=Export')
    await expect(page).toHaveURL('/export')
  })
})
