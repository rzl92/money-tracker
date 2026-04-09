'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { formatRupiah } from '@/lib/utils/currency'
import SummaryCards from '@/components/dashboard/SummaryCards'
import MonthlyBarChart from '@/components/dashboard/MonthlyBarChart'
import CategoryPieChart from '@/components/dashboard/CategoryPieChart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowRight, MessageCircle } from 'lucide-react'

interface Transaction {
  id: string; type: 'income' | 'expense'; amount: number
  description: string | null; date: string; source: string
  category?: { name: string; icon: string; color: string } | null
}

interface MonthlyData { month: string; income: number; expense: number }
interface CategoryData { name: string; value: number; color: string; icon: string }

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({ income: 0, expense: 0 })
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])

  const currentMonth = format(new Date(), 'yyyy-MM')

  useEffect(() => {
    async function loadDashboard() {
      try {
        // Load current month transactions
        const res = await fetch(`/api/transactions?month=${currentMonth}&limit=100`)
        const txs: Transaction[] = await res.json()

        if (!Array.isArray(txs)) return

        // Summary
        const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
        const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
        setSummary({ income, expense })

        // Recent 5
        setRecentTransactions(txs.slice(0, 5))

        // Category breakdown for pie chart
        const catMap = new Map<string, CategoryData>()
        txs.filter(t => t.type === 'expense' && t.category).forEach(t => {
          const cat = t.category!
          const key = cat.name
          const existing = catMap.get(key)
          if (existing) {
            existing.value += t.amount
          } else {
            catMap.set(key, {
              name: cat.name,
              value: t.amount,
              color: cat.color,
              icon: cat.icon,
            })
          }
        })
        setCategoryData(
          Array.from(catMap.values()).sort((a, b) => b.value - a.value).slice(0, 6)
        )

        // Monthly data (last 6 months)
        const months: MonthlyData[] = []
        for (let i = 5; i >= 0; i--) {
          const d = subMonths(new Date(), i)
          const monthStr = format(d, 'yyyy-MM')
          const monthLabel = format(d, 'MMM', { locale: localeId })

          if (i === 0) {
            months.push({ month: monthLabel, income, expense })
          } else {
            try {
              const r = await fetch(`/api/transactions?month=${monthStr}&limit=500`)
              const data: Transaction[] = await r.json()
              if (Array.isArray(data)) {
                months.push({
                  month: monthLabel,
                  income: data.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
                  expense: data.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
                })
              }
            } catch {
              months.push({ month: monthLabel, income: 0, expense: 0 })
            }
          }
        }
        setMonthlyData(months)
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [currentMonth])

  const monthLabel = format(new Date(), 'MMMM yyyy', { locale: localeId })

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <p className="text-sm text-gray-500">Bulan ini</p>
        <h1 className="text-xl font-bold text-gray-900 capitalize">{monthLabel}</h1>
      </div>

      {/* Summary cards */}
      <SummaryCards income={summary.income} expense={summary.expense} />

      {/* Monthly chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-gray-700">Tren 6 Bulan Terakhir</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          <MonthlyBarChart data={monthlyData} />
        </CardContent>
      </Card>

      {/* Category pie chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold text-gray-700">Pengeluaran per Kategori</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <CategoryPieChart data={categoryData} />
        </CardContent>
      </Card>

      {/* Recent transactions */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-gray-700">Transaksi Terbaru</CardTitle>
            <Link href="/transactions" className="text-xs text-indigo-600 flex items-center gap-1 hover:underline">
              Lihat semua <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Belum ada transaksi</p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map(tx => (
                <div key={tx.id} className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ backgroundColor: tx.category?.color ? `${tx.category.color}20` : '#f3f4f6' }}
                  >
                    {tx.category?.icon || (tx.type === 'income' ? '💰' : '💸')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {tx.description || tx.category?.name || (tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran')}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-gray-400">
                        {format(new Date(tx.date), 'd MMM', { locale: localeId })}
                      </p>
                      {tx.source === 'telegram' && (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1 gap-0.5">
                          <MessageCircle className="w-2.5 h-2.5" />
                        </Badge>
                      )}
                    </div>
                  </div>
                  <span className={`text-sm font-semibold flex-shrink-0 ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
