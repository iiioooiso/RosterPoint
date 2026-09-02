import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/auth/confirm',
  '/auth/callback',
  '/invite'
]

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: {
        fetch: (url, options) => {
          return fetch(url, { ...options, cache: 'no-store' })
        }
      },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))

  // Legacy route redirect
  if (pathname === '/create') {
    const url = request.nextUrl.clone()
    url.pathname = '/recruiter/create'
    return NextResponse.redirect(url)
  }

  // 1. Unauthenticated + Protected Route -> /login
  if (!user && !isPublicRoute && pathname !== '/oauth/consent') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    if (pathname !== '/') {
      url.searchParams.set('next', pathname)
    }
    return NextResponse.redirect(url)
  }

  // 2. Authenticated routing logic
  if (user) {
    // Check if the user has a profile (onboarding completed)
    const { data: profile, error: profileError } = await supabase.from('profiles').select('id, role').eq('id', user.id).maybeSingle()
    const hasProfile = !!profile

    if (!hasProfile) {
      // Authenticated + No Profile + Protected Route -> /onboarding
      if (!isPublicRoute && pathname !== '/onboarding') {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        if (profileError) {
          url.searchParams.set('profile_error', profileError.message || profileError.code || 'unknown')
        } else {
          url.searchParams.set('profile_not_found', 'true')
        }
        return NextResponse.redirect(url)
      }
      // Authenticated + No Profile + Auth Route -> /onboarding
      if (pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/reset-password') {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        if (profileError) {
          url.searchParams.set('profile_error', profileError.message || profileError.code || 'unknown')
        } else {
          url.searchParams.set('profile_not_found', 'true')
        }
        return NextResponse.redirect(url)
      }
      // Authenticated + No Profile + /onboarding -> Allowed
    } else {
      const userRole = profile.role // 'student', 'recruiter', or 'interviewer'
      const roleDashboard = `/${userRole}/dashboard`

      // Authenticated + Existing Profile + /onboarding -> role dashboard
      if (pathname === '/onboarding') {
        const url = request.nextUrl.clone()
        url.pathname = roleDashboard
        return NextResponse.redirect(url)
      }
      // Authenticated + Existing Profile + Auth Route -> role dashboard
      if (pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/reset-password') {
        const url = request.nextUrl.clone()
        url.pathname = roleDashboard
        return NextResponse.redirect(url)
      }

      // Enforce role-based access for protected routes
      // If the path starts with /recruiter, /student, or /interviewer, ensure they match the user's role
      const topLevelRoute = pathname.split('/')[1]
      if (['recruiter', 'student', 'interviewer'].includes(topLevelRoute)) {
        if (topLevelRoute !== userRole) {
          // Unauthorized role access -> redirect to their correct dashboard
          const url = request.nextUrl.clone()
          url.pathname = roleDashboard
          return NextResponse.redirect(url)
        }
      }

      // Authenticated + Existing Profile + Valid Protected Route -> Allowed
    }
  }

  return supabaseResponse
}
