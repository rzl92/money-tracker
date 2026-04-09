import UserManagement from '@/components/admin/UserManagement'
import { requireAdminAccess } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function UsersPage() {
  const { user } = await requireAdminAccess()
  const admin = createAdminClient()

  const [authResult, profilesResult] = await Promise.all([
    admin.auth.admin.listUsers(),
    admin.from('profiles').select('id, full_name, role, status, created_at'),
  ])

  const authUsers = authResult.data?.users ?? []
  const profileMap = new Map((profilesResult.data ?? []).map(p => [p.id, p]))

  // Buatkan profile untuk auth users yang belum punya (trigger gagal / user lama)
  const orphans = authUsers.filter(u => !profileMap.has(u.id))
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

  const allUsers = authUsers
    .map(u => {
      const p = profileMap.get(u.id)
      if (!p) return null
      return { id: u.id, email: u.email ?? null, full_name: p.full_name, role: p.role, status: p.status, created_at: p.created_at }
    })
    .filter((u): u is NonNullable<typeof u> => u !== null)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  return <UserManagement initialUsers={allUsers} currentUserId={user.id} />
}
