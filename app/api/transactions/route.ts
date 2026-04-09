import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') // format: YYYY-MM
  const category = searchParams.get('category')
  const type = searchParams.get('type')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = parseInt(searchParams.get('offset') || '0')

  let query = supabase
    .from('transactions')
    .select(`
      *,
      category:categories(id, name, icon, color)
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (month) {
    const start = `${month}-01`
    const end = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0)
      .toISOString().split('T')[0]
    query = query.gte('date', start).lte('date', end)
  }

  if (category) query = query.eq('category_id', category)
  if (type) query = query.eq('type', type)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { type, amount, category_id, description, date } = body

  if (!type || !amount) return NextResponse.json({ error: 'Type dan amount wajib diisi' }, { status: 400 })

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      type,
      amount: parseInt(amount),
      category_id: category_id || null,
      description: description || null,
      date: date || new Date().toISOString().split('T')[0],
      source: 'web',
    })
    .select(`*, category:categories(id, name, icon, color)`)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, type, amount, category_id, description, date } = body
  if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 })

  const { data, error } = await supabase
    .from('transactions')
    .update({ type, amount: parseInt(amount), category_id, description, date })
    .eq('id', id)
    .eq('user_id', user.id)
    .select(`*, category:categories(id, name, icon, color)`)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 })

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
