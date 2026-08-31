'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { resetPasswordAction } from '@/app/auth/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (formData: FormData) => {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await resetPasswordAction(formData)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        setSuccess(result.success)
      }
    })
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Reset password</CardTitle>
        <CardDescription>Enter your email to receive a password reset link</CardDescription>
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
          <Button type="submit" className="w-full mt-2" disabled={isPending || success !== null}>
            {isPending ? "Sending..." : "Send reset link"}
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center border-t py-6">
          <div className="text-center text-sm text-muted-foreground">
            Remember your password?{" "}
            <Link href="/login" className="underline underline-offset-4 hover:text-primary">
              Log in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}
