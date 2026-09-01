'use server'

import { createClient } from '@/lib/server'
import { revalidatePath } from 'next/cache'

export async function updateApplicationNotes(applicationId: string, notes: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('applications')
    .update({ notes })
    .eq('id', applicationId)
    
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath(`/recruiter/applicants/${applicationId}`)
  return { success: true }
}
