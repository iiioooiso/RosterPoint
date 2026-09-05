'use client'

import Image from 'next/image'
import { useTransition } from 'react'
import { signInAction } from '@/app/auth/actions'

export function QuickAccessBanner() {
  const [isPending, startTransition] = useTransition()

  const handleQuickFill = (role: 'student' | 'interviewer' | 'recruiter') => {
    let email = ''
    if (role === 'student') email = 'student@gmail.com'
    else if (role === 'interviewer') email = 'interviewer@gmail.com'
    else if (role === 'recruiter') email = 'recruiter@gmail.com'

    const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement
    const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement
    const confirmPasswordInput = document.querySelector('input[name="confirmPassword"]') as HTMLInputElement
    
    // In React 16+, we need to use the native setter to trigger onChange events properly
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set

    if (emailInput && nativeInputValueSetter) {
      nativeInputValueSetter.call(emailInput, email)
      emailInput.dispatchEvent(new Event('input', { bubbles: true }))
    }
    
    if (passwordInput && nativeInputValueSetter) {
      nativeInputValueSetter.call(passwordInput, 'Demo@12345')
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }))
    }

    if (confirmPasswordInput && nativeInputValueSetter) {
      nativeInputValueSetter.call(confirmPasswordInput, 'Demo@12345')
      confirmPasswordInput.dispatchEvent(new Event('input', { bubbles: true }))
    }

    // Auto-login
    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', 'Demo@12345')

    const searchParams = new URLSearchParams(window.location.search)
    const returnTo = searchParams.get('returnTo') || searchParams.get('next')
    if (returnTo) {
      formData.append('nextUrl', returnTo)
    }

    startTransition(async () => {
      await signInAction(formData)
    })
  }

  return (
    <div className="bg-muted/40 border-b p-3 flex flex-col items-center justify-center gap-1.5 w-full relative">
      <div className="flex items-center gap-2 font-medium text-muted-foreground text-xs">
        <Image src="/favicon-svg.svg" alt="Logo" width={14} height={14} className="opacity-80" />
        <span>BUSY Infotech — Quick Access</span>
      </div>
      <div className="flex items-center gap-2 text-[12px] font-medium">
        <button 
          onClick={() => handleQuickFill('student')}
          disabled={isPending}
          className="bg-background border border-border px-2.5 py-0.5 rounded-md shadow-sm hover:bg-muted hover:border-muted-foreground/30 transition-all text-foreground disabled:opacity-50"
        >
          Student
        </button>
        <button 
          onClick={() => handleQuickFill('interviewer')}
          disabled={isPending}
          className="bg-background border border-border px-2.5 py-0.5 rounded-md shadow-sm hover:bg-muted hover:border-muted-foreground/30 transition-all text-foreground disabled:opacity-50"
        >
          Interviewer
        </button>
        <button 
          onClick={() => handleQuickFill('recruiter')}
          disabled={isPending}
          className="bg-background border border-border px-2.5 py-0.5 rounded-md shadow-sm hover:bg-muted hover:border-muted-foreground/30 transition-all text-foreground disabled:opacity-50"
        >
          Recruiter
        </button>
      </div>
    </div>
  )
}
