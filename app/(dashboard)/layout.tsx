import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/layout/BottomNav'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <Sidebar userName={userName} userEmail={user.email || ''} />

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar for mobile */}
        <TopBar userName={userName} userEmail={user.email || ''} />

        <main className="pb-20 lg:pb-8 px-4 lg:px-8 py-4 lg:py-8 max-w-5xl">
          {children}
        </main>
      </div>

      {/* Bottom nav for mobile */}
      <BottomNav />
    </div>
  )
}
