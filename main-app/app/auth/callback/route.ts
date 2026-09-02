import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  const cookieStore = await cookies()
  const cookieNext = cookieStore.get('oauth_return_to')?.value
  const next = searchParams.get('next') ?? cookieNext ?? null

  // Safety: Prevent open redirects
  const isInternal = next ? (next.startsWith('/') && !next.startsWith('//')) : false
  const safeNext = isInternal ? next : null

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      let finalNext = safeNext
      
      // Check if user has returnTo in metadata from email signup
      const metaReturnTo = data.user?.user_metadata?.returnTo
      if (metaReturnTo && metaReturnTo.startsWith('/')) {
        finalNext = metaReturnTo
      }

      // If no explicit next URL, resolve dashboard by role
      if (!finalNext) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
        const role = profile?.role || 'student'
        finalNext = `/${role}/dashboard`
      }

      const response = NextResponse.redirect(`${origin}${finalNext}`)
      response.cookies.delete('oauth_return_to')
      return response
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Auth session expired or invalid`)
}
