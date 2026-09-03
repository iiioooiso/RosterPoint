import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { acceptCompanyInvitation } from "@/app/actions/company-invites"

export default async function CompanyInvitePage({ 
  params,
  searchParams
}: { 
  params: Promise<{ token: string }>,
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  
  // Unwrap Next.js 15+ promises
  const { token } = await params
  const { error: urlError } = await searchParams
  
  // Verify token exists and is valid using the secure RPC
  const { data: inviteData, error: inviteError } = await supabase
    .rpc('get_company_invitation_info', { invite_token: token })
    .single() 
  const invite = inviteData as any;

  if (inviteError || !invite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
            <CardDescription>This invitation link is invalid or does not exist.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const isExpired = new Date(invite.expires_at) < new Date()
  if (isExpired || invite.accepted_at || invite.revoked_at) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invitation Unavailable</CardTitle>
            <CardDescription>
              {isExpired ? 'This invitation has expired.' : 
               invite.accepted_at ? 'This invitation has already been accepted.' : 
               'This invitation has been revoked.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Determine the current URL to return to after auth
    const returnUrl = `/invite/company/${token}`
    const loginUrl = `/login?returnTo=${encodeURIComponent(returnUrl)}`
    const signupUrl = `/signup?returnTo=${encodeURIComponent(returnUrl)}`

    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Interviewer Invitation</CardTitle>
            <CardDescription>
              {invite.department_name ? (
                <span>You've been invited to join <strong>{invite.company_name}</strong> as an interviewer for the <strong>{invite.department_name}</strong> department.</span>
              ) : (
                <span>You've been invited to join <strong>{invite.company_name}</strong> as a company-wide interviewer.</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Please sign in or create an account to accept.</p>
            <div className="flex flex-col gap-2">
              <Button render={<Link href={loginUrl} />} nativeButton={false}>
                Sign In
              </Button>
              <Button variant="outline" render={<Link href={signupUrl} />} nativeButton={false}>
                Create Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If user is authenticated, fetch their role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role

  if (role === 'student') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Action Not Allowed</CardTitle>
            <CardDescription>
              Students cannot accept interviewer invitations. Please sign in with an interviewer account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" render={<Link href="/login" />} nativeButton={false}>
              Sign in with different account
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (role === 'recruiter') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Action Not Allowed</CardTitle>
            <CardDescription>
              Recruiters cannot accept interviewer invitations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" render={<Link href="/recruiter/dashboard" />} nativeButton={false}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If user is authenticated, check if email matches (if invite has email)
  if (invite.invited_email && invite.invited_email.toLowerCase() !== user.email?.toLowerCase()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Email Mismatch</CardTitle>
            <CardDescription>
              This invitation was sent to {invite.invited_email}, but you are signed in as {user.email}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" render={<Link href="/login" />}>
              Sign in with different account
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Accept Invitation</CardTitle>
          <CardDescription>
            You're signed in as <strong>{user.email}</strong>. Accept the invitation to join <strong>{invite.company_name}</strong>
            {invite.department_name ? (
              <span> for the <strong>{invite.department_name}</strong> department.</span>
            ) : (
              <span> as a company-wide interviewer.</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {urlError && (
            <div className="p-3 text-sm bg-red-50 border border-red-200 text-red-600 rounded-md text-left font-medium">
              {urlError}
            </div>
          )}
          
          <form action={async () => {
            'use server'
            const res = await acceptCompanyInvitation(token)
            if (res?.error) {
              console.error('Accept error:', res.error)
              redirect(`/invite/company/${token}?error=${encodeURIComponent(res.error)}`)
            }
            redirect(`/interviewer/dashboard`)
          }}>
            <Button type="submit" className="w-full">Accept Invitation</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
