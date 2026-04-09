import { createClient } from '@supabase/supabase-js'

const TEST_EMAIL = 'test-auto@money-tracker.local'
const TEST_PASSWORD = 'TestPassword123!'

async function globalSetup() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Hapus user test lama kalau ada
  const { data: existing } = await supabase.auth.admin.listUsers()
  const oldUser = existing?.users?.find(u => u.email === TEST_EMAIL)
  if (oldUser) {
    await supabase.auth.admin.deleteUser(oldUser.id)
  }

  // Buat user test baru (langsung confirmed, skip email)
  const { data, error } = await supabase.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: 'Test User' },
  })

  if (error) {
    throw new Error(`Gagal membuat test user: ${error.message}`)
  }

  // Simpan credentials ke environment
  process.env.TEST_EMAIL = TEST_EMAIL
  process.env.TEST_PASSWORD = TEST_PASSWORD
  process.env.TEST_USER_ID = data.user.id

  console.log(`✅ Test user dibuat: ${TEST_EMAIL}`)
}

export default globalSetup
