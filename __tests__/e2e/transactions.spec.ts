import { test, expect } from '@playwright/test'
import { login } from './helpers'

test.describe('Transaksi', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/transactions')
  })

  test('halaman transaksi tampil dengan benar', async ({ page }) => {
    await expect(page.locator('h1:has-text("Transaksi")')).toBeVisible()
    await expect(page.locator('button:has-text("Tambah")')).toBeVisible()
  })

  test('filter bulan tersedia', async ({ page }) => {
    // Select filter bulan ada
    const select = page.locator('[data-slot="select-trigger"]').first()
    await expect(select).toBeVisible()
  })

  test('menampilkan summary pemasukan & pengeluaran', async ({ page }) => {
    await expect(page.locator('text=Pemasukan').first()).toBeVisible()
    await expect(page.locator('text=Pengeluaran').first()).toBeVisible()
  })

  test('tambah transaksi pengeluaran', async ({ page }) => {
    await page.click('button:has-text("Tambah")')

    // Modal terbuka
    await expect(page.locator('text=Tambah Transaksi')).toBeVisible()

    // Pastikan tipe Pengeluaran sudah aktif
    await expect(page.locator('text=💸 Pengeluaran')).toBeVisible()

    // Isi jumlah
    await page.fill('input[inputmode="numeric"]', '50000')

    // Isi keterangan
    await page.fill('input[placeholder*="Contoh"]', 'Makan siang test')

    // Submit
    await page.click('button:has-text("Tambah")')

    // Toast sukses
    await expect(page.locator('text=Transaksi ditambahkan')).toBeVisible({ timeout: 8000 })
  })

  test('tambah transaksi pemasukan', async ({ page }) => {
    await page.click('button:has-text("Tambah")')

    // Pilih tipe Pemasukan
    await page.click('text=💰 Pemasukan')

    // Isi jumlah
    await page.fill('input[inputmode="numeric"]', '3000000')

    // Isi keterangan
    await page.fill('input[placeholder*="Contoh"]', 'Gaji bulan ini')

    // Submit
    await page.click('button:has-text("Tambah")')

    // Toast sukses
    await expect(page.locator('text=Transaksi ditambahkan')).toBeVisible({ timeout: 8000 })
  })

  test('transaksi yang baru ditambah muncul di list', async ({ page }) => {
    // Tambah dulu
    await page.click('button:has-text("Tambah")')
    await page.fill('input[inputmode="numeric"]', '25000')
    await page.fill('input[placeholder*="Contoh"]', 'Test muncul di list')
    await page.click('button:has-text("Tambah")')
    await page.waitForSelector('text=Transaksi ditambahkan', { timeout: 8000 })

    // Cek di list
    await expect(page.locator('text=Test muncul di list')).toBeVisible({ timeout: 5000 })
  })

  test('validasi jumlah wajib diisi', async ({ page }) => {
    await page.click('button:has-text("Tambah")')
    await page.click('button:has-text("Tambah"):last-of-type')
    // Tidak boleh sukses tanpa amount
    await expect(page.locator('text=Tambah Transaksi')).toBeVisible()
  })

  test('edit transaksi', async ({ page }) => {
    // Tambah transaksi dulu
    await page.click('button:has-text("Tambah")')
    await page.fill('input[inputmode="numeric"]', '75000')
    await page.fill('input[placeholder*="Contoh"]', 'Transaksi untuk diedit')
    await page.click('button:has-text("Tambah")')
    await page.waitForSelector('text=Transaksi ditambahkan', { timeout: 8000 })

    // Klik tombol edit (pensil)
    const editBtn = page.locator('button').filter({ has: page.locator('svg') }).first()
    await page.locator('text=Transaksi untuk diedit').waitFor({ timeout: 5000 })

    // Cari tombol edit di baris yang tepat
    const row = page.locator('text=Transaksi untuk diedit').locator('../../../..')
    await row.locator('[class*="hover:text-indigo"]').first().click()

    // Modal edit terbuka
    await expect(page.locator('text=Edit Transaksi')).toBeVisible()

    // Ganti keterangan
    const descInput = page.locator('input[placeholder*="Contoh"]')
    await descInput.clear()
    await descInput.fill('Transaksi sudah diedit')

    await page.click('button:has-text("Simpan")')
    await expect(page.locator('text=Transaksi diperbarui')).toBeVisible({ timeout: 8000 })
  })

  test('hapus transaksi dengan konfirmasi', async ({ page }) => {
    // Tambah transaksi dulu
    await page.click('button:has-text("Tambah")')
    await page.fill('input[inputmode="numeric"]', '10000')
    await page.fill('input[placeholder*="Contoh"]', 'Transaksi untuk dihapus')
    await page.click('button:has-text("Tambah")')
    await page.waitForSelector('text=Transaksi ditambahkan', { timeout: 8000 })
    await page.locator('text=Transaksi untuk dihapus').waitFor({ timeout: 5000 })

    // Klik tombol hapus
    const row = page.locator('text=Transaksi untuk dihapus').locator('../../../..')
    await row.locator('[class*="hover:text-red"]').first().click()

    // Dialog konfirmasi muncul
    await expect(page.locator('text=Hapus Transaksi?')).toBeVisible()

    // Konfirmasi hapus
    await page.click('button:has-text("Hapus"):not(:has-text("Batal"))')
    await expect(page.locator('text=Transaksi dihapus')).toBeVisible({ timeout: 8000 })
  })

  test('batal hapus → transaksi tetap ada', async ({ page }) => {
    // Tambah transaksi dulu
    await page.click('button:has-text("Tambah")')
    await page.fill('input[inputmode="numeric"]', '15000')
    await page.fill('input[placeholder*="Contoh"]', 'Jangan dihapus')
    await page.click('button:has-text("Tambah")')
    await page.waitForSelector('text=Transaksi ditambahkan', { timeout: 8000 })
    await page.locator('text=Jangan dihapus').waitFor({ timeout: 5000 })

    const row = page.locator('text=Jangan dihapus').locator('../../../..')
    await row.locator('[class*="hover:text-red"]').first().click()

    await page.click('button:has-text("Batal")')

    // Transaksi masih ada
    await expect(page.locator('text=Jangan dihapus')).toBeVisible()
  })
})
