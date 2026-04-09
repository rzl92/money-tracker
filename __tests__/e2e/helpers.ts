import { Page } from '@playwright/test'

export const TEST_EMAIL = 'test-auto@money-tracker.local'
export const TEST_PASSWORD = 'TestPassword123!'

export async function login(page: Page) {
  await page.goto('/login')
  await page.fill('#email', TEST_EMAIL)
  await page.fill('#password', TEST_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL('/', { timeout: 10000 })
}

export async function logout(page: Page) {
  // Trigger logout via Supabase client
  await page.evaluate(async () => {
    const { createBrowserClient } = await import('@supabase/ssr')
    const client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await client.auth.signOut()
  })
  await page.goto('/login')
}
