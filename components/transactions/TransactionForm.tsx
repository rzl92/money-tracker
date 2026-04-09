'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface Category {
  id: string
  name: string
  icon: string
  color: string
  type: string
}

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category_id: string | null
  description: string | null
  date: string
}

interface TransactionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: Transaction | null
  onSuccess: () => void
}

export default function TransactionForm({ open, onOpenChange, transaction, onSuccess }: TransactionFormProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(setCategories)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (transaction) {
      setType(transaction.type)
      setAmount(String(transaction.amount))
      setCategoryId(transaction.category_id || '')
      setDescription(transaction.description || '')
      setDate(transaction.date)
    } else {
      setType('expense')
      setAmount('')
      setCategoryId('')
      setDescription('')
      setDate(format(new Date(), 'yyyy-MM-dd'))
    }
  }, [transaction, open])

  const filteredCategories = categories.filter(
    c => c.type === type || c.type === 'both'
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const numAmount = parseInt(amount.replace(/\D/g, ''))
    if (!numAmount || numAmount <= 0) {
      toast.error('Jumlah tidak valid')
      return
    }

    setLoading(true)
    try {
      const body = {
        id: transaction?.id,
        type,
        amount: numAmount,
        category_id: categoryId || null,
        description: description || null,
        date,
      }

      const res = await fetch('/api/transactions', {
        method: transaction ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }

      toast.success(transaction ? 'Transaksi diperbarui' : 'Transaksi ditambahkan')
      onOpenChange(false)
      onSuccess()
    } catch (err: unknown) {
      toast.error('Gagal menyimpan', { description: err instanceof Error ? err.message : 'Terjadi kesalahan' })
    } finally {
      setLoading(false)
    }
  }

  function formatAmountInput(value: string) {
    const num = value.replace(/\D/g, '')
    if (!num) return ''
    return parseInt(num).toLocaleString('id-ID')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{transaction ? 'Edit Transaksi' : 'Tambah Transaksi'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2 rounded-lg text-sm font-medium transition-all ${
                type === 'expense'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              💸 Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2 rounded-lg text-sm font-medium transition-all ${
                type === 'income'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              💰 Pemasukan
            </button>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label>Jumlah (Rp)</Label>
            <Input
              placeholder="0"
              value={formatAmountInput(amount)}
              onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              required
              className="text-lg font-semibold"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Kategori</Label>
            <Select value={categoryId} onValueChange={(v) => v && setCategoryId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih kategori (opsional)" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Keterangan</Label>
            <Input
              placeholder="Contoh: Makan siang di warteg"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label>Tanggal</Label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {transaction ? 'Simpan' : 'Tambah'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
