import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import crypto from 'crypto'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Delete old tokens
  await supabase.from('telegram_link_tokens').delete().eq('user_id', user.id)

  // Create new token
  const token = crypto.randomBytes(16).toString('hex')
  const { error } = await supabase
    .from('telegram_link_tokens')
    .insert({ token, user_id: user.id })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ token })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('telegram_users')
    .select('telegram_id, created_at')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ connected: !!data, telegram_id: data?.telegram_id })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await supabase.from('telegram_users').delete().eq('user_id', user.id)
  return NextResponse.json({ success: true })
}
