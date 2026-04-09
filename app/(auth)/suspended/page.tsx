import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertTriangle, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCurrentUserProfile } from '@/lib/auth'

export default async function SuspendedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { profile, profilesEnabled } = await getCurrentUserProfile(user.id)

  if (!profilesEnabled) redirect('/')
  if (profile?.status === 'active') redirect('/')
  if (profile?.status === 'pending' || !profile) redirect('/pending')

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <Card className="w-full max-w-lg border-0 shadow-xl">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl">Akun dinonaktifkan</CardTitle>
          <CardDescription>
            Akses ke aplikasi sedang ditangguhkan. Hubungi admin untuk meminta aktivasi kembali.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-900">
          <div className="flex items-center justify-between gap-2">
            <span>{user.email}</span>
            <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
              Suspended
            </Badge>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <form action={signOut} className="w-full sm:w-auto">
          <Button type="submit" variant="outline" className="w-full sm:w-auto">
            <LogOut className="mr-2 h-4 w-4" />
            Keluar
          </Button>
        </form>
        <Link href="/login" className="w-full sm:w-auto">
          <Button variant="ghost" className="w-full sm:w-auto">
            Kembali ke login
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
