import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Define the public routes that do not require authentication
const publicRoutes = [
  '/', 
  '/login', 
  '/signup', 
  '/forgot-password', 
  '/reset-password', 
  '/auth/confirm', 
  '/auth/callback'
]

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
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
    const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle()
    const hasProfile = !!profile

    if (!hasProfile) {
      // Authenticated + No Profile + Protected Route -> /onboarding
      if (!isPublicRoute && pathname !== '/onboarding') {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }
      // Authenticated + No Profile + Auth Route -> /onboarding
      if (pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/reset-password') {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }
      // Authenticated + No Profile + /onboarding -> Allowed
    } else {
      // Authenticated + Existing Profile + /onboarding -> /dashboard
      if (pathname === '/onboarding') {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
      // Authenticated + Existing Profile + Auth Route -> /dashboard
      if (pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/reset-password') {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard' 
        return NextResponse.redirect(url)
      }
      // Authenticated + Existing Profile + Protected Route -> Allowed
    }
  }

  return supabaseResponse
}
