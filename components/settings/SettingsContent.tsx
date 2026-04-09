'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Copy, RefreshCw, Unlink, Loader2, CheckCircle2, ExternalLink } from 'lucide-react'

export default function SettingsContent() {
  const [connected, setConnected] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [token, setToken] = useState('')
  const [generatingToken, setGeneratingToken] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [copied, setCopied] = useState(false)

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'CatatanUang_Bot'

  useEffect(() => {
    checkConnection()
  }, [])

  async function checkConnection() {
    setCheckingStatus(true)
    try {
      const res = await fetch('/api/telegram/link-token')
      const data = await res.json()
      setConnected(data.connected)
    } catch {
      // silently fail
    } finally {
      setCheckingStatus(false)
    }
  }

  async function generateToken() {
    setGeneratingToken(true)
    try {
      const res = await fetch('/api/telegram/link-token', { method: 'POST' })
      const data = await res.json()
      if (data.token) {
        setToken(data.token)
        toast.success('Token berhasil dibuat', { description: 'Token berlaku selama 10 menit' })
      }
    } catch {
      toast.error('Gagal membuat token')
    } finally {
      setGeneratingToken(false)
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      await fetch('/api/telegram/link-token', { method: 'DELETE' })
      setConnected(false)
      setToken('')
      toast.success('Telegram berhasil diputuskan')
    } catch {
      toast.error('Gagal memutuskan koneksi')
    } finally {
      setDisconnecting(false)
    }
  }

  async function copyToken() {
    if (!token) return
    await navigator.clipboard.writeText(`/link ${token}`)
    setCopied(true)
    toast.success('Disalin! Tempel pesan ini di Telegram Bot')
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Pengaturan</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola koneksi dan preferensi akun</p>
      </div>

      {/* Telegram connection */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">Telegram Bot</CardTitle>
                <CardDescription className="text-xs">Catat langsung dari Telegram</CardDescription>
              </div>
            </div>
            {!checkingStatus && (
              <Badge variant={connected ? 'default' : 'secondary'} className={connected ? 'bg-green-100 text-green-700 hover:bg-green-100' : ''}>
                {connected ? '● Terhubung' : '○ Belum terhubung'}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {checkingStatus ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            </div>
          ) : connected ? (
            <>
              <div className="bg-green-50 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Akun terhubung!</p>
                  <p className="text-xs text-green-700 mt-1">
                    Kamu bisa mengirim pesan ke bot untuk mencatat pengeluaran atau pemasukan secara langsung.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs text-gray-600">
                <p className="font-semibold text-gray-900 text-sm">Contoh pesan ke bot:</p>
                <div className="space-y-1 font-mono bg-white rounded-lg p-3 border">
                  <p>makan siang 35000</p>
                  <p>transport 15rb</p>
                  <p>gaji 5000000</p>
                  <p>pemasukan freelance 2jt</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  nativeButton={false}
                  render={<a href={`https://t.me/${botUsername}`} target="_blank" rel="noopener noreferrer" />}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Buka Bot
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                >
                  {disconnecting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Unlink className="w-4 h-4 mr-2" />
                  )}
                  Putuskan
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
                  <p className="font-medium mb-2">Cara menghubungkan:</p>
                  <ol className="space-y-1.5 text-xs list-decimal list-inside">
                    <li>Klik tombol &quot;Buat Token&quot; di bawah</li>
                    <li>Salin token yang muncul</li>
                    <li>Buka Telegram dan cari <strong>@{botUsername}</strong></li>
                    <li>Tempel dan kirim pesan token tersebut</li>
                  </ol>
                </div>

                {!token ? (
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={generateToken}
                    disabled={generatingToken}
                  >
                    {generatingToken ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <MessageCircle className="w-4 h-4 mr-2" />
                    )}
                    Buat Token
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1.5">Kirim pesan ini ke bot:</p>
                      <div className="bg-gray-100 rounded-lg p-3 font-mono text-sm text-gray-900 flex items-center gap-2">
                        <span className="flex-1 truncate">/link {token}</span>
                        <button
                          onClick={copyToken}
                          className="text-indigo-600 hover:text-indigo-700 flex-shrink-0"
                        >
                          {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-amber-600 mt-1.5">⏳ Token berlaku 10 menit</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={generateToken}
                        disabled={generatingToken}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Buat Baru
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                        nativeButton={false}
                  render={<a href={`https://t.me/${botUsername}`} target="_blank" rel="noopener noreferrer" />}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Buka Bot
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      onClick={checkConnection}
                    >
                      Cek status koneksi
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
