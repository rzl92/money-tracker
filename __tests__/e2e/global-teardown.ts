import { createClient } from '@supabase/supabase-js'

const TEST_EMAIL = 'test-auto@money-tracker.local'

async function globalTeardown() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase.auth.admin.listUsers()
  const testUser = data?.users?.find(u => u.email === TEST_EMAIL)
  if (testUser) {
    await supabase.auth.admin.deleteUser(testUser.id)
    console.log(`🗑️  Test user dihapus: ${TEST_EMAIL}`)
  }
}

export default globalTeardown
