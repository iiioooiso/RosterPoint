'use client'

import { useState, useTransition } from 'react'
import { completeOnboardingAction } from '@/app/auth/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function OnboardingPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (formData: FormData) => {
    setError(null)
    startTransition(async () => {
      const result = await completeOnboardingAction(formData)
      if (result?.error) {
        setError(result.error)
      } else if (result?.url) {
        window.location.href = result.url
      }
    })
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Complete your profile</CardTitle>
        <CardDescription>Select your role to continue</CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="grid gap-4 pb-6">
          {error && (
            <div className="text-sm font-medium text-destructive text-center">
              {error}
            </div>
          )}
          <div className="flex items-center gap-3">
            <Label htmlFor="role">I am a...</Label>
            <Select name="role" required defaultValue="student">
              <SelectTrigger>
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false} align="start" side="bottom" sideOffset={8}>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="recruiter">Recruiter</SelectItem>
                <SelectItem value="interviewer">Interviewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full mt-2" disabled={isPending}>
            {isPending ? "Saving..." : "Continue"}
          </Button>
        </CardContent>
      </form>
    </Card>
  )
}
