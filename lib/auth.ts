import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export type UserRole = 'admin' | 'user'
export type UserStatus = 'pending' | 'active' | 'suspended'

export interface UserProfile {
  id: string
  full_name: string | null
  role: UserRole
  status: UserStatus
}

export interface ProfileLookupResult {
  profile: UserProfile | null
  profilesEnabled: boolean
}

function isMissingProfilesTable(message?: string) {
  return message?.includes("Could not find the table 'public.profiles'") ?? false
}

export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

export async function getCurrentUserProfile(userId: string): Promise<ProfileLookupResult> {
  const service = await createServiceClient()
  const { data, error } = await service
    .from('profiles')
    .select('id, full_name, role, status')
    .eq('id', userId)
    .maybeSingle<UserProfile>()

  if (error) {
    if (isMissingProfilesTable(error.message)) {
      return { profile: null, profilesEnabled: false }
    }

    throw new Error(error.message)
  }

  return { profile: data, profilesEnabled: true }
}

export async function requireAppAccess() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const { profile, profilesEnabled } = await getCurrentUserProfile(user.id)

  if (!profilesEnabled) {
    return { user, profile: null, profilesEnabled: false }
  }

  if (!profile) redirect('/pending')
  if (profile.status === 'pending') redirect('/pending')
  if (profile.status === 'suspended') redirect('/suspended')

  return { user, profile, profilesEnabled: true }
}

export async function requireAdminAccess() {
  const { user, profile, profilesEnabled } = await requireAppAccess()

  if (!profilesEnabled) {
    redirect('/')
  }

  if (!profile || profile.role !== 'admin') {
    redirect('/')
  }

  return { user, profile, profilesEnabled }
}
