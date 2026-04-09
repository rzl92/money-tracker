'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatRupiah, formatRupiahShort } from '@/lib/utils/currency'

interface CategoryData {
  name: string
  value: number
  color: string
  icon: string
}

interface CategoryPieChartProps {
  data: CategoryData[]
}

function CustomTooltip({ active, payload }: { active?: boolean, payload?: {payload: CategoryData, value: number}[] }) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold">{item.icon} {item.name}</p>
      <p className="text-gray-600 mt-1">{formatRupiah(item.value)}</p>
    </div>
  )
}

export default function CategoryPieChart({ data }: CategoryPieChartProps) {
  if (!data.length) return (
    <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
      Belum ada pengeluaran bulan ini
    </div>
  )

  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="space-y-1.5">
        {data.slice(0, 5).map((item) => {
          const total = data.reduce((s, d) => s + d.value, 0)
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
          return (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-gray-600 flex-1 truncate">{item.icon} {item.name}</span>
              <span className="text-xs font-medium text-gray-900">{pct}%</span>
              <span className="text-xs text-gray-400">{formatRupiahShort(item.value)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
