import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('Kategori', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/categories')
  })

  test('halaman kategori tampil dengan benar', async ({ page }) => {
    await expect(page.locator('h1:has-text("Kategori")')).toBeVisible()
    await expect(page.locator('button:has-text("Tambah")')).toBeVisible()
  })

  test('kategori default sudah ada', async ({ page }) => {
    await expect(page.locator('text=Makan & Minum')).toBeVisible({ timeout: 8000 })
    await expect(page.locator('text=Transport')).toBeVisible()
    await expect(page.locator('text=Gaji')).toBeVisible()
  })

  test('tambah kategori baru', async ({ page }) => {
    await page.click('button:has-text("Tambah")')

    // Modal terbuka
    await expect(page.locator('text=Tambah Kategori')).toBeVisible()

    // Isi nama
    await page.fill('input[placeholder*="Contoh: Makan"]', 'Test Kategori Baru')

    // Pilih tipe
    const typeSelect = page.locator('[data-slot="select-trigger"]')
    await typeSelect.click()
    await page.locator('text=Pengeluaran').last().click()

    // Simpan
    await page.click('button:has-text("Simpan")')
    await expect(page.locator('text=Kategori ditambahkan')).toBeVisible({ timeout: 8000 })
  })

  test('kategori baru muncul di list', async ({ page }) => {
    await page.click('button:has-text("Tambah")')
    await page.fill('input[placeholder*="Contoh: Makan"]', 'Kategori Muncul Di List')
    await page.click('button:has-text("Simpan")')
    await page.waitForSelector('text=Kategori ditambahkan', { timeout: 8000 })

    await expect(page.locator('text=Kategori Muncul Di List')).toBeVisible({ timeout: 5000 })
  })

  test('validasi nama wajib diisi', async ({ page }) => {
    await page.click('button:has-text("Tambah")')
    await page.click('button:has-text("Simpan")')
    // Toast error muncul
    await expect(page.locator('text=Nama wajib diisi')).toBeVisible({ timeout: 5000 })
  })

  test('edit kategori', async ({ page }) => {
    // Tambah dulu
    await page.click('button:has-text("Tambah")')
    await page.fill('input[placeholder*="Contoh: Makan"]', 'Kategori Diedit')
    await page.click('button:has-text("Simpan")')
    await page.waitForSelector('text=Kategori ditambahkan', { timeout: 8000 })
    await page.locator('text=Kategori Diedit').waitFor({ timeout: 5000 })

    // Klik edit
    const row = page.locator('text=Kategori Diedit').locator('../../..')
    await row.locator('[class*="hover:text-indigo"]').first().click()

    // Modal edit terbuka
    await expect(page.locator('text=Edit Kategori')).toBeVisible()

    // Ubah nama
    const nameInput = page.locator('input[placeholder*="Contoh: Makan"]')
    await nameInput.clear()
    await nameInput.fill('Kategori Sudah Diedit')

    await page.click('button:has-text("Simpan")')
    await expect(page.locator('text=Kategori diperbarui')).toBeVisible({ timeout: 8000 })
  })

  test('hapus kategori dengan konfirmasi', async ({ page }) => {
    // Tambah dulu
    await page.click('button:has-text("Tambah")')
    await page.fill('input[placeholder*="Contoh: Makan"]', 'Kategori Dihapus')
    await page.click('button:has-text("Simpan")')
    await page.waitForSelector('text=Kategori ditambahkan', { timeout: 8000 })
    await page.locator('text=Kategori Dihapus').waitFor({ timeout: 5000 })

    // Klik hapus
    const row = page.locator('text=Kategori Dihapus').locator('../../..')
    await row.locator('[class*="hover:text-red"]').first().click()

    // Konfirmasi
    await expect(page.locator('text=Hapus Kategori?')).toBeVisible()
    await page.click('button:has-text("Hapus"):not(:has-text("Batal"))')
    await expect(page.locator('text=Kategori dihapus')).toBeVisible({ timeout: 8000 })
  })

  test('preview kategori muncul saat mengetik nama', async ({ page }) => {
    await page.click('button:has-text("Tambah")')
    await page.fill('input[placeholder*="Contoh: Makan"]', 'Preview Test')
    await expect(page.locator('text=Preview Test').last()).toBeVisible()
  })
})
