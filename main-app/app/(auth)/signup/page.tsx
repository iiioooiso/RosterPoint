'use client'

import { Suspense, useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signUpAction, signInWithGoogleAction } from '@/app/auth/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function SignupContent() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [role, setRole] = useState("student")
  const [isPending, startTransition] = useTransition()
  
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') || searchParams.get('next')
  const isInterviewerInvite = returnTo?.startsWith('/invite/interviewer/')

  const handleSubmit = async (formData: FormData) => {
    setError(null)
    setSuccess(null)
    
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (returnTo) {
      formData.append('nextUrl', returnTo)
    }

    startTransition(async () => {
      const result = await signUpAction(formData)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        setSuccess(result.success)
      }
    })
  }

  const handleGoogleSubmit = async () => {
    setError(null)
    setSuccess(null)
    
    // Do not use startTransition for external redirects
    const result = await signInWithGoogleAction(returnTo)
    
    if (result?.error) {
      setError(result.error)
    } else if (result?.url) {
      window.location.href = result.url
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>Enter your details below to get started</CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="grid gap-4 pb-6">
          {error && (
            <div className="text-sm font-medium text-destructive text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm font-medium text-green-600 text-center bg-green-50/50 p-3 rounded-md">
              {success}
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="m@example.com" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={6} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={6} />
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="role">I am a...</Label>
            {isInterviewerInvite ? (
              <>
                <Input value="Interviewer" disabled className="bg-muted text-muted-foreground flex-1" />
                <input type="hidden" name="role" value="interviewer" />
              </>
            ) : (
              <Select name="role" required value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your role">
                    {role === 'student' ? 'Student' : role === 'recruiter' ? 'Recruiter' : role === 'interviewer' ? 'Interviewer' : 'Select your role'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false} align="start" side="bottom" sideOffset={8}>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="recruiter">Recruiter</SelectItem>
                  <SelectItem value="interviewer">Interviewer</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          <Button type="submit" className="w-full mt-2" disabled={isPending || success !== null}>
            {isPending ? "Signing up..." : "Sign up"}
          </Button>
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <Button type="button" onClick={handleGoogleSubmit} disabled={isPending || success !== null} variant="outline" className="w-full gap-2 text-foreground font-normal">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center border-t py-4">
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href={returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login"} className="underline underline-offset-4 hover:text-primary">
              Log in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupContent />
    </Suspense>
  )
}
