'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { formatRupiahShort } from '@/lib/utils/currency'

interface MonthlyData {
  month: string
  income: number
  expense: number
}

interface MonthlyBarChartProps {
  data: MonthlyData[]
}

function CustomTooltip({ active, payload, label }: { active?: boolean, payload?: {name: string, value: number, color: string}[], label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-900 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-600">{p.name}:</span>
          <span className="font-medium">{formatRupiahShort(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function MonthlyBarChart({ data }: MonthlyBarChartProps) {
  if (!data.length) return (
    <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
      Belum ada data
    </div>
  )

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }} barSize={12}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tickFormatter={formatRupiahShort} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={55} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
          formatter={(value) => value === 'income' ? 'Pemasukan' : 'Pengeluaran'}
        />
        <Bar dataKey="income" name="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="expense" fill="#f97316" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
