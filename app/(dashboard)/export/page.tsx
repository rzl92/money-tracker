'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react'

function getMonthOptions() {
  const options = [{ value: 'all', label: 'Semua waktu' }]
  const now = new Date()
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    options.push({
      value: format(d, 'yyyy-MM'),
      label: format(d, 'MMMM yyyy', { locale: localeId }),
    })
  }
  return options
}

export default function ExportPage() {
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [loading, setLoading] = useState(false)
  const monthOptions = getMonthOptions()

  async function handleExport() {
    setLoading(true)
    try {
      const params = month !== 'all' ? `?month=${month}` : ''
      const res = await fetch(`/api/export${params}`)

      if (!res.ok) {
        toast.error('Gagal mengekspor data')
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      const disposition = res.headers.get('Content-Disposition')
      const filenameMatch = disposition?.match(/filename="(.+)"/)
      a.download = filenameMatch?.[1] || 'catatan-keuangan.xlsx'

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('File berhasil diunduh!')
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const selectedLabel = monthOptions.find(o => o.value === month)?.label || ''

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Export Laporan</h1>
        <p className="text-sm text-gray-500 mt-1">Unduh data keuanganmu dalam format Excel</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-base">Excel (.xlsx)</CardTitle>
              <CardDescription className="text-xs">Berisi sheet Transaksi dan Ringkasan</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Periode</label>
            <Select value={month} onValueChange={(v) => v && setMonth(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm text-gray-600">
            <p className="font-medium text-gray-900">Yang akan diunduh:</p>
            <ul className="space-y-1 list-disc list-inside text-xs">
              <li>Sheet <strong>Transaksi</strong>: semua transaksi {selectedLabel !== 'Semua waktu' ? selectedLabel : 'seluruh waktu'}</li>
              <li>Sheet <strong>Ringkasan</strong>: total pemasukan, pengeluaran, dan saldo</li>
              <li>Format tanggal: dd/mm/yyyy</li>
              <li>Jumlah dalam Rupiah</li>
            </ul>
          </div>

          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            onClick={handleExport}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {loading ? 'Menyiapkan file...' : 'Unduh Excel'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
