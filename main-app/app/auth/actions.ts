'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/server'
import { headers, cookies } from 'next/headers'

export async function signInAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  
  const nextUrl = formData.get('nextUrl') as string
  if (nextUrl) {
    redirect(nextUrl)
  }
  
  redirect('/dashboard')
}

export async function signUpAction(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string
  const supabase = await createClient()
  
  const headersList = await headers()
  const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  if (role !== 'recruiter' && role !== 'interviewer' && role !== 'student') {
    return { error: 'Invalid role selected.' }
  }

  const nextUrl = formData.get('nextUrl') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: {
        role,
        returnTo: nextUrl || null,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Check your email to confirm your account.' }
}

export async function signOutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function resetPasswordAction(formData: FormData) {
  const email = formData.get('email') as string
  const supabase = await createClient()
  
  const headersList = await headers()
  const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Check your email for a password reset link.' }
}

export async function updatePasswordAction(formData: FormData) {
  const password = formData.get('password') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard') // This will be intercepted by middleware and redirected to correct dashboard
}

export async function signInWithGoogleAction(nextUrl?: string | null) {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  if (nextUrl) {
    const cookieStore = await cookies()
    cookieStore.set('oauth_return_to', nextUrl, { path: '/', maxAge: 60 * 10 }) // 10 minutes
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    return { url: data.url }
  }
}

export async function completeOnboardingAction(formData: FormData) {
  const role = formData.get('role') as string
  
  if (role !== 'recruiter' && role !== 'interviewer' && role !== 'student') {
    return { error: 'Invalid role selected.' }
  }

  const name = formData.get('name') as string
  const ageStr = formData.get('age') as string
  const age = ageStr ? parseInt(ageStr, 10) : null
  const sex = formData.get('sex') as string
  const university_name = formData.get('university_name') as string
  const company_name = formData.get('company_name') as string
  const job_title = formData.get('job_title') as string

  const supabase = await createClient()
  
  // Verify authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated.' }
  }

  // Call the secure RPC to create the profile atomically
  const { error } = await supabase.rpc('create_user_profile', { 
    user_role: role,
    p_name: name || null,
    p_age: age || null,
    p_sex: sex || null,
    p_university_name: university_name || null,
    p_company_name: company_name || null,
    p_job_title: job_title || null
  })

  if (error) {
    return { error: error.message || 'Failed to complete onboarding.' }
  }

  revalidatePath('/', 'layout')
  return { url: `/${role}/dashboard` }
}

