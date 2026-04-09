'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Wallet, LogOut, Shield } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { UserRole } from '@/lib/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface TopBarProps {
  userName: string
  userEmail: string
  userRole: UserRole
}

export default function TopBar({ userName, userEmail, userRole }: TopBarProps) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Berhasil keluar')
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <Wallet className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-gray-900">Catatan Uang</span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <Avatar className="w-8 h-8 cursor-pointer">
            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
              {userName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <div className="px-2 py-1.5">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{userName}</p>
              {userRole === 'admin' && <Badge variant="outline">Admin</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
          </div>
          {userRole === 'admin' && (
            <DropdownMenuItem render={<Link href="/users" />}>
              <Shield className="w-4 h-4 mr-2" />
              User Management
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
            <LogOut className="w-4 h-4 mr-2" />
            Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
