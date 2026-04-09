'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { toast } from 'sonner'
import { formatRupiah } from '@/lib/utils/currency'
import TransactionForm from '@/components/transactions/TransactionForm'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Loader2, ArrowDownCircle, ArrowUpCircle, MessageCircle } from 'lucide-react'

interface Category {
  id: string; name: string; icon: string; color: string
}

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category_id: string | null
  description: string | null
  date: string
  source: string
  category?: Category | null
}

function getMonthOptions() {
  const options = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    options.push({
      value: format(d, 'yyyy-MM'),
      label: format(d, 'MMMM yyyy', { locale: localeId }),
    })
  }
  return options
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [deleteTx, setDeleteTx] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [filterType, setFilterType] = useState('all')

  const monthOptions = getMonthOptions()

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ month, limit: '100' })
      if (filterType !== 'all') params.set('type', filterType)
      const res = await fetch(`/api/transactions?${params}`)
      const data = await res.json()
      setTransactions(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Gagal memuat transaksi')
    } finally {
      setLoading(false)
    }
  }, [month, filterType])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  async function handleDelete() {
    if (!deleteTx) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/transactions?id=${deleteTx.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Transaksi dihapus')
      setDeleteTx(null)
      fetchTransactions()
    } catch {
      toast.error('Gagal menghapus')
    } finally {
      setDeleting(false)
    }
  }

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Transaksi</h1>
        <Button
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700"
          onClick={() => { setEditTx(null); setFormOpen(true) }}
        >
          <Plus className="w-4 h-4 mr-1" /> Tambah
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 bg-green-50">
          <CardContent className="p-4">
            <p className="text-xs text-green-700 font-medium">Pemasukan</p>
            <p className="text-lg font-bold text-green-700">{formatRupiah(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 bg-red-50">
          <CardContent className="p-4">
            <p className="text-xs text-red-700 font-medium">Pengeluaran</p>
            <p className="text-lg font-bold text-red-700">{formatRupiah(totalExpense)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Select value={month} onValueChange={(v) => v && setMonth(v)}>
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={(v) => v && setFilterType(v)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="expense">Pengeluaran</SelectItem>
            <SelectItem value="income">Pemasukan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transaction list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ArrowLeftRight className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Belum ada transaksi di bulan ini</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map(tx => (
            <Card key={tx.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: tx.category?.color ? `${tx.category.color}20` : '#f3f4f6' }}
                  >
                    {tx.category?.icon || (tx.type === 'income' ? '💰' : '💸')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {tx.description || tx.category?.name || (tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran')}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">
                        {format(new Date(tx.date), 'd MMM yyyy', { locale: localeId })}
                      </span>
                      {tx.source === 'telegram' && (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 gap-0.5">
                          <MessageCircle className="w-2.5 h-2.5" /> Telegram
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`font-semibold text-sm ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setEditTx(tx); setFormOpen(true) }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTx(tx)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form modal */}
      <TransactionForm
        open={formOpen}
        onOpenChange={setFormOpen}
        transaction={editTx}
        onSuccess={fetchTransactions}
      />

      {/* Delete confirm */}
      <Dialog open={!!deleteTx} onOpenChange={() => setDeleteTx(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Transaksi?</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTx(null)}>Batal</Button>
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

function ArrowLeftRight({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 3M21 7.5H7.5" />
    </svg>
  )
}
