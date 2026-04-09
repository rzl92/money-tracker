'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Wallet, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      const isUnconfirmed = error.message.toLowerCase().includes('email not confirmed')
      toast.error('Login gagal', {
        description: isUnconfirmed
          ? 'Email belum dikonfirmasi. Minta admin untuk mengaktifkan akun kamu.'
          : 'Email atau password salah.',
      })
      setLoading(false)
      return
    }

    const currentUserId = (await supabase.auth.getUser()).data.user?.id

    if (currentUserId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', currentUserId)
        .maybeSingle()

      const missingProfilesTable = profileError?.message?.includes("Could not find the table 'public.profiles'")

      if (!missingProfilesTable) {
        if (profile?.status === 'pending' || !profile) {
          router.push('/pending')
          router.refresh()
          return
        }

        if (profile?.status === 'suspended') {
          router.push('/suspended')
          router.refresh()
          return
        }
      }
    }

    router.push('/')
    router.refresh()
  }

  return (
    <Card className="w-full max-w-sm shadow-xl border-0">
      <CardHeader className="text-center space-y-3 pb-4">
        <div className="mx-auto w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Wallet className="w-7 h-7 text-white" />
        </div>
        <div>
          <CardTitle className="text-2xl">Selamat Datang</CardTitle>
          <CardDescription>Masuk ke akun keuanganmu</CardDescription>
        </div>
      </CardHeader>

      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Masuk
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Belum punya akun?{' '}
            <Link href="/register" className="text-indigo-600 hover:underline font-medium">
              Daftar sekarang
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
