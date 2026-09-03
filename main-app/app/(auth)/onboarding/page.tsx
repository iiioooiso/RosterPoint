'use client'

import { useState, useTransition } from 'react'
import { completeOnboardingAction } from '@/app/auth/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

export default function OnboardingPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [role, setRole] = useState<string>("student")
  const [sex, setSex] = useState<string>("")

  const handleSubmit = async (formData: FormData) => {
    setError(null)
    startTransition(async () => {
      const result = await completeOnboardingAction(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Complete your profile</CardTitle>
        <CardDescription>Select your role and provide your details to continue</CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="grid gap-4 pb-6">
          {error && (
            <div className="text-sm font-medium text-destructive text-center">
              {error}
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <Label htmlFor="role-select">I am a...</Label>
            <Select name="role" required value={role} onValueChange={(val) => val && setRole(val)}>
              <SelectTrigger id="role-select">
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
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" required placeholder="Jane Doe" autoComplete="name" />
          </div>

          {role === 'student' && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="age">Age</Label>
                <Input id="age" name="age" type="number" required placeholder="21" min="16" max="120" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="sex-select">Sex</Label>
                <Select name="sex" required value={sex} onValueChange={setSex}>
                  <SelectTrigger id="sex-select">
                    <SelectValue placeholder="Select">
                      {sex === 'male' ? 'Male' : sex === 'female' ? 'Female' : sex === 'other' ? 'Other' : sex === 'prefer_not_to_say' ? 'Prefer not to say' : 'Select'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="university_name">University Name</Label>
                <Input id="university_name" name="university_name" required placeholder="State University" />
              </div>
            </>
          )}

          {role === 'recruiter' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input id="company_name" name="company_name" required placeholder="Acme Corp" autoComplete="organization" />
            </div>
          )}

          {(role === 'recruiter' || role === 'interviewer') && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input id="job_title" name="job_title" required placeholder={role === 'recruiter' ? 'Senior Recruiter' : 'Software Engineer'} autoComplete="organization-title" />
            </div>
          )}

          <Button type="submit" className="w-full mt-4" disabled={isPending}>
            {isPending ? "Saving..." : "Continue"}
          </Button>
        </CardContent>
      </form>
    </Card>
  )
}
