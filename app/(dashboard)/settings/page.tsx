import SettingsContent from '@/components/settings/SettingsContent'
import { requireAdminAccess } from '@/lib/auth'

export default async function SettingsPage() {
  await requireAdminAccess()

  return <SettingsContent />
}
