import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  const cookieStore = await cookies()
  const cookieNext = cookieStore.get('oauth_return_to')?.value
  const next = searchParams.get('next') ?? cookieNext ?? '/dashboard'

  // Safety: Prevent open redirects
  const isInternal = next.startsWith('/') && !next.startsWith('//')
  const safeNext = isInternal ? next : '/dashboard'

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

      const response = NextResponse.redirect(`${origin}${finalNext}`)
      response.cookies.delete('oauth_return_to')
      return response
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Auth session expired or invalid`)
}
