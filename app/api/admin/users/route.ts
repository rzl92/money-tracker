import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAccess } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  await requireAdminAccess()
  const admin = createAdminClient()

  const [authResult, profilesResult] = await Promise.all([
    admin.auth.admin.listUsers(),
    admin.from('profiles').select('id, full_name, role, status, created_at'),
  ])

  if (authResult.error) {
    return NextResponse.json({ error: authResult.error.message }, { status: 500 })
  }
  if (profilesResult.error) {
    if (profilesResult.error.message.includes("Could not find the table")) {
      return NextResponse.json({ error: 'Jalankan migration schema_v2.sql dulu.' }, { status: 503 })
    }
    return NextResponse.json({ error: profilesResult.error.message }, { status: 500 })
  }

  const profileMap = new Map((profilesResult.data ?? []).map(p => [p.id, p]))

  // Auto-create profiles for auth users that don't have one yet
  const orphans = authResult.data.users.filter(u => !profileMap.has(u.id))
  await Promise.all(orphans.map(async orphan => {
    const { data } = await admin
      .from('profiles')
      .upsert({
        id: orphan.id,
        full_name: orphan.user_metadata?.full_name || null,
        role: 'user',
        status: 'pending',
      })
      .select('id, full_name, role, status, created_at')
      .single()
    if (data) profileMap.set(data.id, data)
  }))

  const result = authResult.data.users
    .map(u => {
      const p = profileMap.get(u.id)
      if (!p) return null
      return {
        id: u.id,
        email: u.email ?? null,
        full_name: p.full_name,
        role: p.role,
        status: p.status,
        created_at: p.created_at,
      }
    })
    .filter((u): u is NonNullable<typeof u> => u !== null)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  return NextResponse.json(result)
}

export async function PATCH(req: NextRequest) {
  const { user } = await requireAdminAccess()
  const admin = createAdminClient()

  const body = await req.json()
  const { id, role, status } = body

  if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 })
  if (id === user.id) return NextResponse.json({ error: 'Tidak bisa mengubah akun sendiri' }, { status: 400 })

  const updates: Record<string, string> = {}
  if (role) updates.role = role
  if (status) updates.status = status
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Tidak ada perubahan' }, { status: 400 })
  }

  // Saat diaktifkan, konfirmasi email otomatis agar user bisa langsung login
  if (status === 'active') {
    await admin.auth.admin.updateUserById(id, { email_confirm: true })
  }

  const { data, error } = await admin
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select('id, full_name, role, status, created_at')
    .single()

  if (error) {
    if (error.message.includes("Could not find the table")) {
      return NextResponse.json({ error: 'Jalankan migration schema_v2.sql dulu.' }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  await requireAdminAccess()
  const admin = createAdminClient()

  const body = await req.json()
  const { email, password, full_name, role } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 })
  }

  const userRole = ['admin', 'user'].includes(role) ? role : 'user'

  // Check if user already exists in auth
  const { data: listData } = await admin.auth.admin.listUsers()
  const existing = listData?.users.find(u => u.email === email)

  let authUserId: string
  let authUserEmail: string

  if (existing) {
    // User already registered (e.g. self-registered but pending) — just activate profile
    authUserId = existing.id
    authUserEmail = existing.email ?? email
  } else {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || '' },
    })
    if (createErr) return NextResponse.json({ error: createErr.message }, { status: 400 })
    authUserId = created.user.id
    authUserEmail = created.user.email ?? email
  }

  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .upsert({ id: authUserId, full_name: full_name || null, role: userRole, status: 'active' })
    .select('id, full_name, role, status, created_at')
    .single()

  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 })
  if (!profile) return NextResponse.json({ error: 'Gagal menyimpan profil user' }, { status: 500 })

  return NextResponse.json({ ...profile, email: authUserEmail }, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { user } = await requireAdminAccess()
  const admin = createAdminClient()

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 })
  if (id === user.id) return NextResponse.json({ error: 'Tidak bisa menghapus akun sendiri' }, { status: 400 })

  // Hapus dari auth.users — profiles terhapus otomatis via ON DELETE CASCADE
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
