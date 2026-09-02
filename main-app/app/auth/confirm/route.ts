import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? null

  // Safety: Prevent open redirects
  const isInternal = next ? (next.startsWith('/') && !next.startsWith('//')) : false
  const safeNext = isInternal ? next : null

  const redirectTo = request.nextUrl.clone()
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')

  if (token_hash && type) {
    const supabase = await createClient()

    const { data: { user }, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (!error && user) {
      // Check if user has returnTo in metadata
      const metaReturnTo = user?.user_metadata?.returnTo
      if (metaReturnTo && metaReturnTo.startsWith('/') && !metaReturnTo.startsWith('//') && metaReturnTo !== '/dashboard' && metaReturnTo !== '/') {
        redirectTo.pathname = metaReturnTo
      } else if (safeNext && safeNext !== '/dashboard' && safeNext !== '/') {
        redirectTo.pathname = safeNext
      } else {
        // Resolve dashboard by role
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
        if (!profile) {
          redirectTo.pathname = '/onboarding'
        } else {
          const role = profile.role || 'student'
          redirectTo.pathname = `/${role}/dashboard`
        }
      }
      
      redirectTo.searchParams.delete('next')
      return NextResponse.redirect(redirectTo)
    }
  }

  // return the user to an error page with some instructions
  redirectTo.pathname = '/login'
  redirectTo.searchParams.set('error', 'Auth link is invalid or has expired')
  return NextResponse.redirect(redirectTo)
}
