import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isApiRoute = pathname.startsWith('/api/')
  const isLoginPage = pathname.startsWith('/login')
  const isRegisterPage = pathname.startsWith('/register')
  const isPendingPage = pathname.startsWith('/pending')
  const isSuspendedPage = pathname.startsWith('/suspended')
  const isAuthPage = isLoginPage || isRegisterPage || isPendingPage || isSuspendedPage
  const isPublic = isAuthPage || isApiRoute

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (!user) {
    return supabaseResponse
  }

  const service = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {},
      },
    }
  )

  const { data: profile, error: profileError } = await service
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .maybeSingle()

  const missingProfilesTable = profileError?.message?.includes("Could not find the table 'public.profiles'")
  if (missingProfilesTable) {
    return supabaseResponse
  }

  const status = profile?.status ?? 'pending'

  if (isApiRoute) {
    return supabaseResponse
  }

  if (status === 'pending' && !isPendingPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/pending'
    return NextResponse.redirect(url)
  }

  if (status === 'suspended' && !isSuspendedPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/suspended'
    return NextResponse.redirect(url)
  }

  if (status === 'active' && (isLoginPage || isRegisterPage || isPendingPage || isSuspendedPage)) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if ((status === 'pending' && isSuspendedPage) || (status === 'suspended' && isPendingPage)) {
    const url = request.nextUrl.clone()
    url.pathname = status === 'pending' ? '/pending' : '/suspended'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
