'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Users, Shield, Clock, MoreHorizontal, UserPlus, RefreshCw,
  Loader2, Search, CheckCircle2, XCircle, Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { UserRole, UserStatus } from '@/lib/auth'

interface ManagedUser {
  id: string
  full_name: string | null
  email: string | null
  role: UserRole
  status: UserStatus
  created_at: string
}

interface UserManagementProps {
  initialUsers: ManagedUser[]
  currentUserId: string
}

const STATUS_CONFIG: Record<UserStatus, { label: string; dot: string; badge: string }> = {
  active:    { label: 'Aktif',     dot: 'bg-green-500', badge: 'bg-green-100 text-green-700 hover:bg-green-100' },
  pending:   { label: 'Pending',   dot: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
  suspended: { label: 'Suspended', dot: 'bg-red-500',   badge: 'bg-red-100   text-red-700   hover:bg-red-100'   },
}

function getInitials(name: string | null, email: string | null) {
  if (name?.trim()) return name.trim().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  if (email) return email[0].toUpperCase()
  return '?'
}

export default function UserManagement({ initialUsers, currentUserId }: UserManagementProps) {
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'user' as UserRole })
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null)
  const [deleting, setDeleting] = useState(false)

  const stats = useMemo(() => ({
    total:   users.length,
    active:  users.filter(u => u.status === 'active').length,
    pending: users.filter(u => u.status === 'pending').length,
  }), [users])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return users
    return users.filter(u =>
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    )
  }, [users, search])

  async function updateUser(id: string, updates: { role?: UserRole; status?: UserStatus }) {
    setLoadingId(id)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui')
      // Merge agar email di state tidak hilang (PATCH tidak return email)
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u))
      toast.success('Berhasil diperbarui')
    } catch (err) {
      toast.error('Gagal', { description: err instanceof Error ? err.message : 'Terjadi kesalahan' })
    } finally {
      setLoadingId(null)
    }
  }

  async function refreshUsers() {
    setRefreshing(true)
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal memuat')
      setUsers(data)
      toast.success('Daftar diperbarui')
    } catch (err) {
      toast.error('Gagal', { description: err instanceof Error ? err.message : 'Terjadi kesalahan' })
    } finally {
      setRefreshing(false)
    }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal membuat user')
      if (!data?.id || !data?.role || !data?.status) throw new Error('Respons tidak valid dari server')

      setUsers(prev => {
        const exists = prev.find(u => u.id === data.id)
        if (exists) return prev.map(u => u.id === data.id ? { ...u, ...data } : u)
        return [...prev, data]
      })
      setShowCreateDialog(false)
      setForm({ full_name: '', email: '', password: '', role: 'user' })
      toast.success('User berhasil ditambahkan')
    } catch (err) {
      toast.error('Gagal', { description: err instanceof Error ? err.message : 'Terjadi kesalahan' })
    } finally {
      setCreating(false)
    }
  }

  async function deleteUser() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/users?id=${deleteTarget.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus user')
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id))
      setDeleteTarget(null)
      toast.success('User berhasil dihapus')
    } catch (err) {
      toast.error('Gagal', { description: err instanceof Error ? err.message : 'Terjadi kesalahan' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Kelola akses dan role pengguna</p>
        </div>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
          onClick={() => setShowCreateDialog(true)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Tambah User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',   value: stats.total,   icon: Users,        bg: 'bg-indigo-100', color: 'text-indigo-600' },
          { label: 'Aktif',   value: stats.active,  icon: CheckCircle2, bg: 'bg-green-100',  color: 'text-green-600'  },
          { label: 'Pending', value: stats.pending, icon: Clock,        bg: 'bg-amber-100',  color: 'text-amber-600'  },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', bg)}>
                  <Icon className={cn('h-4 w-4', color)} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* List */}
      <Card className="border-0 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex gap-2 p-4 border-b border-gray-100">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Cari nama atau email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={refreshUsers} disabled={refreshing} className="shrink-0 h-9 w-9 p-0">
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </Button>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-50">
          {filtered.length === 0 ? (
            <div className="py-14 text-center">
              <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                {search ? 'Tidak ditemukan' : 'Belum ada user'}
              </p>
            </div>
          ) : (
            filtered.map(user => {
              const isSelf   = user.id === currentUserId
              const isLoading = loadingId === user.id
              const cfg      = STATUS_CONFIG[user.status]
              const name     = user.full_name?.trim() || 'Tanpa nama'
              const initials = getInitials(user.full_name, user.email)

              return (
                <div
                  key={user.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 transition-colors',
                    isLoading && 'opacity-50 pointer-events-none'
                  )}
                >
                  {/* Avatar */}
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name + email */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-gray-900 truncate">{name}</span>
                      {isSelf && (
                        <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full shrink-0">
                          Kamu
                        </span>
                      )}
                    </div>
                    {user.email && (
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                    <Badge variant="secondary" className={cn('text-xs gap-1', cfg.badge)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cfg.dot)} />
                      {cfg.label}
                    </Badge>
                    <Badge variant="outline" className={cn('text-xs', user.role === 'admin' && 'border-indigo-200 text-indigo-700 bg-indigo-50')}>
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </Badge>
                  </div>

                  {/* Mobile badges (compact) */}
                  <div className="flex sm:hidden items-center gap-1 shrink-0">
                    <span className={cn('w-2 h-2 rounded-full', cfg.dot)} />
                    {user.role === 'admin' && <Shield className="h-3 w-3 text-indigo-600" />}
                  </div>

                  {/* Action */}
                  {isSelf ? (
                    <div className="w-8 shrink-0" />
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        disabled={isLoading}
                        className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:pointer-events-none disabled:opacity-50 outline-none"
                      >
                        {isLoading
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <MoreHorizontal className="h-4 w-4" />
                        }
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" side="bottom" sideOffset={4} className="w-44">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Status</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => user.status !== 'active' && updateUser(user.id, { status: 'active' })}
                            className={cn(user.status === 'active' && 'font-semibold text-green-700')}
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Aktif
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => user.status !== 'pending' && updateUser(user.id, { status: 'pending' })}
                            className={cn(user.status === 'pending' && 'font-semibold text-amber-700')}
                          >
                            <Clock className="h-4 w-4 text-amber-500" />
                            Pending
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => user.status !== 'suspended' && updateUser(user.id, { status: 'suspended' })}
                            className={cn(user.status === 'suspended' && 'font-semibold text-red-700')}
                          >
                            <XCircle className="h-4 w-4 text-red-500" />
                            Suspend
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Role</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => user.role !== 'user' && updateUser(user.id, { role: 'user' })}
                            className={cn(user.role === 'user' && 'font-semibold')}
                          >
                            <Users className="h-4 w-4 text-gray-500" />
                            User
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => user.role !== 'admin' && updateUser(user.id, { role: 'admin' })}
                            className={cn(user.role === 'admin' && 'font-semibold text-indigo-700')}
                          >
                            <Shield className="h-4 w-4 text-indigo-500" />
                            Admin
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(user)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Hapus User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )
            })
          )}
        </div>
      </Card>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!deleting && !open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus User</DialogTitle>
            <DialogDescription>
              Tindakan ini permanen dan tidak bisa dibatalkan. Semua data transaksi dan kategori milik user ini juga akan terhapus.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-red-100 text-red-700 text-xs font-bold">
                  {getInitials(deleteTarget.full_name, deleteTarget.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {deleteTarget.full_name?.trim() || 'Tanpa nama'}
                </p>
                {deleteTarget.email && (
                  <p className="text-xs text-gray-500 truncate">{deleteTarget.email}</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Batal
            </Button>
            <Button
              variant="outline"
              className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
              onClick={deleteUser}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deleting ? 'Menghapus...' : 'Ya, Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={open => {
        if (!creating) {
          setShowCreateDialog(open)
          if (!open) setForm({ full_name: '', email: '', password: '', role: 'user' })
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah User Baru</DialogTitle>
            <DialogDescription>
              User langsung aktif setelah dibuat. Jika email sudah terdaftar, akun tersebut akan diaktifkan.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={createUser}>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="f-name">Nama</Label>
                <Input
                  id="f-name"
                  placeholder="Nama lengkap"
                  value={form.full_name}
                  onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-email">Email <span className="text-red-500">*</span></Label>
                <Input
                  id="f-email"
                  type="email"
                  placeholder="nama@email.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-password">Password <span className="text-red-500">*</span></Label>
                <Input
                  id="f-password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select
                  value={form.role}
                  onValueChange={v => setForm(p => ({ ...p, role: v as UserRole }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User — akses fitur utama</SelectItem>
                    <SelectItem value="admin">Admin — akses penuh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
                disabled={creating}
              >
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {creating ? 'Membuat...' : 'Tambah User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
