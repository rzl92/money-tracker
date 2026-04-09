import { test, expect } from '@playwright/test'
import { TEST_EMAIL, TEST_PASSWORD, login } from './helpers'

test.describe('Auth - Halaman Login', () => {
  test('halaman login bisa diakses', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/Catatan Uang/)
    await expect(page.locator('text=Selamat Datang')).toBeVisible()
  })

  test('menampilkan form email dan password', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('link ke halaman register ada', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('text=Daftar sekarang')).toBeVisible()
  })

  test('login dengan kredensial salah → tampil error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', 'salah@email.com')
    await page.fill('#password', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.locator('text=Login gagal')).toBeVisible({ timeout: 5000 })
  })

  test('login berhasil → redirect ke dashboard', async ({ page }) => {
    await login(page)
    await expect(page).toHaveURL('/')
    await expect(page.locator('text=Bulan ini')).toBeVisible()
  })

  test('user yang sudah login tidak bisa akses halaman login', async ({ page }) => {
    await login(page)
    await page.goto('/login')
    await expect(page).toHaveURL('/')
  })
})

test.describe('Auth - Halaman Register', () => {
  test('halaman register bisa diakses', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('text=Buat Akun')).toBeVisible()
  })

  test('form register menampilkan semua field', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('#name')).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
  })

  test('link balik ke login ada', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('text=Masuk')).toBeVisible()
  })
})

test.describe('Auth - Proteksi Route', () => {
  test('akses / tanpa login → redirect ke /login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/login/)
  })

  test('akses /transactions tanpa login → redirect ke /login', async ({ page }) => {
    await page.goto('/transactions')
    await expect(page).toHaveURL(/login/)
  })

  test('akses /categories tanpa login → redirect ke /login', async ({ page }) => {
    await page.goto('/categories')
    await expect(page).toHaveURL(/login/)
  })

  test('akses /export tanpa login → redirect ke /login', async ({ page }) => {
    await page.goto('/export')
    await expect(page).toHaveURL(/login/)
  })
})
