'use client'

import { useState, useTransition } from 'react'
import { updateProfileAction } from '@/app/actions/profile'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'

export function ProfileForm({ profile }: { profile: any }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = async (formData: FormData) => {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await updateProfileAction(formData)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        setSuccess(result.success)
      }
    })
  }

  const role = profile.role

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Profile Settings</CardTitle>
        <CardDescription>Update your personal and professional details.</CardDescription>
      </CardHeader>
      <form action={handleSubmit}>
        <CardContent className="grid gap-6">
          {error && (
            <div className="text-sm font-medium text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm font-medium text-green-600">
              {success}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label>Role</Label>
            <Input disabled value={role.charAt(0).toUpperCase() + role.slice(1)} />
            <p className="text-xs text-muted-foreground">Your role cannot be changed.</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" required defaultValue={profile.name || ''} />
          </div>

          {role === 'student' && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="age">Age</Label>
                <Input id="age" name="age" type="number" required defaultValue={profile.age || ''} min="16" max="120" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="sex">Sex</Label>
                <Select name="sex" required defaultValue={profile.sex || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
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
                <Input id="university_name" name="university_name" required defaultValue={profile.university_name || ''} />
              </div>
            </>
          )}

          {(role === 'recruiter' || role === 'interviewer') && (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input id="company_name" name="company_name" required defaultValue={profile.company_name || ''} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="job_title">Job Title</Label>
                <Input id="job_title" name="job_title" required defaultValue={profile.job_title || ''} />
              </div>
            </>
          )}

          <div className="flex justify-end gap-4 mt-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  )
}
