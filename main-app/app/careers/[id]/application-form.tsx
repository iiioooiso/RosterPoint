'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { submitApplication } from '@/app/actions/applications'
import { Button, buttonVariants } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'
import { Opening, ApplicationMaterials } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export function ApplicationForm({ opening }: { opening: Opening }) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    setError(null)
    
    const result = await submitApplication(opening.id, formData)
    
    if (result?.error) {
      setError(result.error)
      // If user is not logged in, redirect to login
      if (result.error === 'You must be logged in to apply.') {
        router.push(`/login?next=/careers/${opening.id}`)
      }
    } else if (result?.success) {
      setSuccess(true)
      formRef.current?.reset()
    }
    
    setIsPending(false)
  }

  const materials = opening.application_materials as ApplicationMaterials || {
    resume: { enabled: true, required: true },
    portfolio: { enabled: false, required: false },
    cover_letter: { enabled: false, required: false }
  };

  if (success) {
    return (
      <div className="bg-green-50/50 border border-green-200 dark:border-green-900/50 dark:bg-green-950/20 rounded-lg p-8 mt-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto text-green-600 dark:text-green-400">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-300">Application Submitted</h3>
          <p className="text-green-700 dark:text-green-400 text-sm max-w-sm mx-auto">We've received your application and will be in touch soon regarding next steps.</p>
        </div>
        <div className="pt-2">
          <Link
            href="/student/dashboard"
            className={cn(buttonVariants({ variant: "default", size: "default" }), "gap-2 inline-flex")}
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mt-8">
      <div className="mb-8">
        <h2 className="text-xl font-medium tracking-tight text-foreground">Apply for this role</h2>
        <p className="text-muted-foreground mt-1 text-sm">Please provide the requested materials to submit your application.</p>
      </div>

      <form action={handleSubmit} ref={formRef} className="space-y-6">
        {error && (
          <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}
        
        {materials.resume?.enabled && (
          <div className="space-y-2">
            <Label htmlFor="resume" className="text-sm font-medium text-foreground">
              Resume (PDF) {materials.resume.required ? <span className="text-destructive">*</span> : <span className="text-muted-foreground font-normal">(Optional)</span>}
            </Label>
            <Input 
              id="resume" 
              name="resume" 
              type="file" 
              accept="application/pdf" 
              required={materials.resume.required} 
              className="cursor-pointer file:cursor-pointer file:font-medium file:text-foreground text-muted-foreground"
            />
          </div>
        )}

        {materials.portfolio?.enabled && (
          <div className="space-y-2">
            <Label htmlFor="portfolio" className="text-sm font-medium text-foreground">
              Portfolio Link {materials.portfolio.required ? <span className="text-destructive">*</span> : <span className="text-muted-foreground font-normal">(Optional)</span>}
            </Label>
            <Input 
              id="portfolio" 
              name="portfolio" 
              type="url" 
              placeholder="https://..."
              required={materials.portfolio.required} 
            />
          </div>
        )}

        {materials.cover_letter?.enabled && (
          <div className="space-y-2">
            <Label htmlFor="cover_letter" className="text-sm font-medium text-foreground">
              Cover Letter {materials.cover_letter.required ? <span className="text-destructive">*</span> : <span className="text-muted-foreground font-normal">(Optional)</span>}
            </Label>
            <Textarea 
              id="cover_letter" 
              name="cover_letter" 
              rows={4}
              placeholder="Tell us why you are a great fit for this role..."
              required={materials.cover_letter.required} 
            />
          </div>
        )}

        {materials.custom_questions && materials.custom_questions.map((q) => (
          <div key={q.id} className="space-y-2">
            <Label htmlFor={`custom_${q.id}`} className="text-sm font-medium text-foreground">
              {q.title} {q.required ? <span className="text-destructive">*</span> : <span className="text-muted-foreground font-normal">(Optional)</span>}
            </Label>
            {q.type === 'textarea' ? (
              <Textarea 
                id={`custom_${q.id}`} 
                name={`custom_${q.id}`} 
                required={q.required}
                rows={3}
              />
            ) : q.type === 'file' ? (
              <Input 
                id={`custom_${q.id}`} 
                name={`custom_${q.id}`} 
                type="file" 
                required={q.required}
                className="cursor-pointer file:cursor-pointer file:font-medium file:text-foreground text-muted-foreground"
              />
            ) : (
              <Input 
                id={`custom_${q.id}`} 
                name={`custom_${q.id}`} 
                type="text" 
                required={q.required} 
              />
            )}
          </div>
        ))}
        
        <div className="pt-4 flex justify-end border-t mt-8">
          <Button type="submit" disabled={isPending} className="px-8 shadow-sm">
            {isPending ? "Submitting..." : "Submit Application"}
          </Button>
        </div>
      </form>
    </div>
  )
}
