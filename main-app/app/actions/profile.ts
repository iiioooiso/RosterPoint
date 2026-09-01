'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/server'

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient()
  
  // Verify authenticated user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated.' }
  }

  const name = formData.get('name') as string
  const ageStr = formData.get('age') as string
  const age = ageStr ? parseInt(ageStr, 10) : null
  const sex = formData.get('sex') as string
  const university_name = formData.get('university_name') as string
  const company_name = formData.get('company_name') as string
  const job_title = formData.get('job_title') as string

  // We rely on RLS policy to allow updating own profile details
  const { error } = await supabase
    .from('profiles')
    .update({
      name: name || null,
      age: age || null,
      sex: sex || null,
      university_name: university_name || null,
      company_name: company_name || null,
      job_title: job_title || null,
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message || 'Failed to update profile.' }
  }

  revalidatePath('/profile/settings')
  return { success: 'Profile updated successfully.' }
}
