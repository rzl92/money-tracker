import { formatRupiah } from '@/lib/utils/currency'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'

interface SummaryCardsProps {
  income: number
  expense: number
}

export default function SummaryCards({ income, expense }: SummaryCardsProps) {
  const balance = income - expense

  return (
    <div className="space-y-3">
      {/* Balance card */}
      <Card className="border-0 bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-lg">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-4 h-4 opacity-80" />
            <p className="text-sm opacity-80">Saldo Bulan Ini</p>
          </div>
          <p className="text-3xl font-bold">{formatRupiah(balance)}</p>
          <p className="text-xs opacity-70 mt-1">
            {balance >= 0 ? '✨ Keuanganmu sehat!' : '⚠️ Pengeluaran melebihi pemasukan'}
          </p>
        </CardContent>
      </Card>

      {/* Income & Expense */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 bg-green-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-xs text-green-700 font-medium">Pemasukan</p>
            </div>
            <p className="text-lg font-bold text-green-700">{formatRupiah(income)}</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-red-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-xs text-red-600 font-medium">Pengeluaran</p>
            </div>
            <p className="text-lg font-bold text-red-600">{formatRupiah(expense)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
