'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'

interface Category {
  id: string; name: string; icon: string; color: string; type: string
}

const PRESET_ICONS = ['🍽️','🚗','🛒','🎬','💊','📱','💰','💻','📦','✈️','🏠','🎓','👗','⚡','🏋️','🎮','💄','🐶','🌿','☕']
const PRESET_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#f97316','#f59e0b',
  '#22c55e','#10b981','#06b6d4','#3b82f6','#6b7280',
]

const typeLabel: Record<string, string> = {
  expense: 'Pengeluaran',
  income: 'Pemasukan',
  both: 'Keduanya',
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editCat, setEditCat] = useState<Category | null>(null)
  const [deleteCat, setDeleteCat] = useState<Category | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📦')
  const [color, setColor] = useState('#6366f1')
  const [type, setType] = useState('both')

  async function fetchCategories() {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Gagal memuat kategori')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCategories() }, [])

  function openAdd() {
    setEditCat(null)
    setName(''); setIcon('📦'); setColor('#6366f1'); setType('both')
    setFormOpen(true)
  }

  function openEdit(cat: Category) {
    setEditCat(cat)
    setName(cat.name); setIcon(cat.icon); setColor(cat.color); setType(cat.type)
    setFormOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error('Nama wajib diisi'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/categories', {
        method: editCat ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editCat?.id, name, icon, color, type }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(editCat ? 'Kategori diperbarui' : 'Kategori ditambahkan')
      setFormOpen(false)
      fetchCategories()
    } catch (err: unknown) {
      toast.error('Gagal menyimpan', { description: err instanceof Error ? err.message : undefined })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteCat) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/categories?id=${deleteCat.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Kategori dihapus')
      setDeleteCat(null)
      fetchCategories()
    } catch {
      toast.error('Gagal menghapus')
    } finally {
      setDeleting(false)
    }
  }

  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both')
  const incomeCategories = categories.filter(c => c.type === 'income' || c.type === 'both')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Kategori</h1>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={openAdd}>
          <Plus className="w-4 h-4 mr-1" /> Tambah
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="space-y-5">
          {[
            { label: 'Pengeluaran', cats: expenseCategories.filter(c => c.type === 'expense') },
            { label: 'Pemasukan', cats: categories.filter(c => c.type === 'income') },
            { label: 'Keduanya', cats: categories.filter(c => c.type === 'both') },
          ].map(group => group.cats.length > 0 && (
            <div key={group.label}>
              <h2 className="text-sm font-semibold text-gray-500 mb-2">{group.label}</h2>
              <div className="grid grid-cols-1 gap-2">
                {group.cats.map(cat => (
                  <Card key={cat.id} className="border-0 shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                          style={{ backgroundColor: `${cat.color}20` }}
                        >
                          {cat.icon}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{cat.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                            <span className="text-xs text-gray-400">{typeLabel[cat.type]}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(cat)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteCat(cat)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editCat ? 'Edit Kategori' : 'Tambah Kategori'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Kategori</Label>
              <Input placeholder="Contoh: Makan Siang" value={name} onChange={e => setName(e.target.value)} required />
            </div>

            <div className="space-y-1.5">
              <Label>Emoji / Icon</Label>
              <div className="grid grid-cols-10 gap-1.5">
                {PRESET_ICONS.map(ic => (
                  <button
                    key={ic} type="button"
                    onClick={() => setIcon(ic)}
                    className={`w-9 h-9 text-xl flex items-center justify-center rounded-lg transition-all ${icon === ic ? 'bg-indigo-100 ring-2 ring-indigo-500' : 'hover:bg-gray-100'}`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Warna</Label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c} type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Jenis</Label>
              <Select value={type} onValueChange={(v) => v && setType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Pengeluaran</SelectItem>
                  <SelectItem value="income">Pemasukan</SelectItem>
                  <SelectItem value="both">Keduanya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${color}20` }}>
                {icon}
              </div>
              <div>
                <p className="font-medium text-sm">{name || 'Nama Kategori'}</p>
                <p className="text-xs text-gray-400">{typeLabel[type]}</p>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setFormOpen(false)}>Batal</Button>
              <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Simpan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteCat} onOpenChange={() => setDeleteCat(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Kategori?</DialogTitle>
            <DialogDescription>
              Transaksi yang sudah menggunakan kategori ini tidak akan terhapus, tapi kategorinya akan kosong.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteCat(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
