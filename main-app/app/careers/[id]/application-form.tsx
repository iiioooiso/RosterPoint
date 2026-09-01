'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { submitApplication } from '@/app/actions/applications'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export function ApplicationForm({ openingId }: { openingId: string }) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setError(null)
    
    const result = await submitApplication(openingId, formData)
    
    if (result?.error) {
      setError(result.error)
      // If user is not logged in, redirect to login
      if (result.error === 'You must be logged in to apply.') {
        router.push(`/login?next=/careers/${openingId}`)
      }
    } else if (result?.success) {
      setSuccess(true)
      formRef.current?.reset()
    }
    
    setIsPending(false)
  }

  if (success) {
    return (
      <Card className="bg-green-50/50 border-green-200">
        <CardContent className="pt-6 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <h3 className="text-lg font-medium text-green-800">Application Submitted</h3>
          <p className="text-green-700 text-sm">We've received your application and will be in touch soon.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-xl overflow-hidden border-border/60 shadow-sm">
      <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
        <CardTitle className="text-lg font-medium">Apply for this role</CardTitle>
        <CardDescription>Upload your resume to submit your application.</CardDescription>
      </CardHeader>
      <form action={handleSubmit} ref={formRef}>
        <CardContent className="space-y-6 pt-6">
          {error && (
            <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-3">
            <Label htmlFor="resume" className="text-sm font-medium text-foreground">Resume (PDF)</Label>
            <Input 
              id="resume" 
              name="resume" 
              type="file" 
              accept="application/pdf" 
              required 
              className="cursor-pointer file:cursor-pointer file:font-medium file:text-foreground text-muted-foreground"
            />
          </div>
          
          <div className="pt-2 flex justify-end">
            <Button type="submit" disabled={isPending} className="px-6 shadow-sm">
              {isPending ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  )
}
