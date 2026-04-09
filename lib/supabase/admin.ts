import { createClient } from '@supabase/supabase-js'

// Client dengan service role — bypass RLS, untuk admin operations
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
