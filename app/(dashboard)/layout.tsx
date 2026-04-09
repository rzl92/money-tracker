import BottomNav from '@/components/layout/BottomNav'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import { requireAppAccess } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile, profilesEnabled } = await requireAppAccess()

  const userName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna'
  const userRole = profilesEnabled && profile ? profile.role : 'user'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar for desktop */}
      <Sidebar userName={userName} userEmail={user.email || ''} userRole={userRole} />

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar for mobile */}
        <TopBar userName={userName} userEmail={user.email || ''} userRole={userRole} />

        <main className="pb-20 lg:pb-8 px-4 lg:px-8 py-4 lg:py-8 max-w-5xl">
          {children}
        </main>
      </div>

      {/* Bottom nav for mobile */}
      <BottomNav userRole={userRole} />
    </div>
  )
}
