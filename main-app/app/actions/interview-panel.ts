'use server'

import { createClient } from '@/lib/server'
import { revalidatePath } from 'next/cache'

export async function addInterviewerToApplication(applicationId: string, interviewerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check if they are already assigned
  const { data: existingAssignment } = await supabase
    .from('application_interviewers')
    .select('id')
    .eq('application_id', applicationId)
    .eq('interviewer_id', interviewerId)
    .single()

  if (existingAssignment) {
    return { error: 'Interviewer is already assigned to this application.' }
  }

  // Create or update request to pending
  const { data: existingRequest } = await supabase
    .from('interview_requests')
    .select('id')
    .eq('application_id', applicationId)
    .eq('interviewer_id', interviewerId)
    .single()

  let error;
  if (existingRequest) {
    const { error: updateError } = await supabase
      .from('interview_requests')
      .update({ status: 'pending', recruiter_id: user.id })
      .eq('id', existingRequest.id)
    error = updateError;
  } else {
    const { error: insertError } = await supabase
      .from('interview_requests')
      .insert({ 
        application_id: applicationId, 
        interviewer_id: interviewerId,
        recruiter_id: user.id,
        status: 'pending' 
      })
    error = insertError;
  }

  if (error) {
    return { error: 'Failed to send interview request. Please check permissions and try again.' }
  }

  revalidatePath('/recruiter/interview-panel')
  return { success: true }
}

export async function removeInterviewerFromApplication(applicationId: string, interviewerId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('application_interviewers')
    .delete()
    .eq('application_id', applicationId)
    .eq('interviewer_id', interviewerId)

  if (error) {
    return { error: 'Failed to remove interviewer.' }
  }

  revalidatePath('/recruiter/interview-panel')
  return { success: true }
}

export async function bulkAddInterviewer(applicationIds: string[], interviewerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, results: { successCount: 0, failures: [] } }
  
  const results = {
    successCount: 0,
    failures: [] as { applicationId: string; error: string }[]
  }

  for (const appId of applicationIds) {
    // Check existing
    const { data: existing } = await supabase.from('application_interviewers').select('id').eq('application_id', appId).eq('interviewer_id', interviewerId).single()
    if (existing) continue;

    const { data: existingRequest } = await supabase
      .from('interview_requests')
      .select('id')
      .eq('application_id', appId)
      .eq('interviewer_id', interviewerId)
      .single()

    let error;
    if (existingRequest) {
      const { error: updateError } = await supabase
        .from('interview_requests')
        .update({ status: 'pending', recruiter_id: user.id })
        .eq('id', existingRequest.id)
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('interview_requests')
        .insert({ application_id: appId, interviewer_id: interviewerId, recruiter_id: user.id, status: 'pending' })
      error = insertError;
    }
      
    if (error) {
      results.failures.push({ applicationId: appId, error: error.message })
    } else {
      results.successCount++
    }
  }

  revalidatePath('/recruiter/interview-panel')
  return { success: true, results }
}

export async function bulkRemoveInterviewer(applicationIds: string[], interviewerId: string) {
  const supabase = await createClient()
  
  const results = {
    successCount: 0,
    failures: [] as { applicationId: string; error: string }[]
  }

  for (const appId of applicationIds) {
    const { error } = await supabase
      .from('application_interviewers')
      .delete()
      .eq('application_id', appId)
      .eq('interviewer_id', interviewerId)
      
    if (error) {
      results.failures.push({ applicationId: appId, error: error.message })
    } else {
      results.successCount++
    }
  }

  revalidatePath('/recruiter/interview-panel')
  return { success: true, results }
}

export async function getApplicationDetails(applicationId: string) {
  const supabase = await createClient()

  const { data: appData, error: appError } = await supabase
    .from('applications')
    .select(`
      id,
      stage,
      candidate_name,
      candidate_email,
      source,
      created_at,
      opening:openings(id, title, department)
    `)
    .eq('id', applicationId)
    .single()

  if (appError) {
    return { error: 'Failed to load application details.' }
  }

  const { data: panelData } = await supabase
    .from('application_interviewers')
    .select(`
      id,
      interviewer:profiles(id, name)
    `)
    .eq('application_id', applicationId)

  const { data: historyData } = await supabase
    .from('application_history')
    .select(`
      id,
      event_type,
      details,
      created_at,
      actor:profiles(name)
    `)
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false })

  return { 
    application: appData, 
    panel: panelData || [], 
    history: historyData || [] 
  }
}
