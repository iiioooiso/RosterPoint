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

  // Fetch application's company_id and department
  const { data: application } = await supabase
    .from('applications')
    .select('opening:openings(company_id, department)')
    .eq('id', applicationId)
    .single()
    
  const opening = application?.opening as any;
  const companyId = opening?.company_id;
  const openingDepartment = opening?.department;

  if (!companyId) {
    return { error: 'Application or company not found.' }
  }

  // Verify interviewer is an active member of the company and eligible for the opening department
  const { data: memberships } = await supabase
    .from('interviewer_company_memberships')
    .select('id, department_id, department:departments(id, name)')
    .eq('interviewer_id', interviewerId)
    .eq('company_id', companyId)
    .eq('status', 'active')

  if (!memberships || memberships.length === 0) {
    return { error: 'Interviewer has not joined this company.' }
  }

  const isEligible = memberships.some((m: any) => {
    // Company-wide membership permits any department
    if (!m.department_id) return true;
    // Department-scoped membership requires matching department
    const deptName = m.department?.name || '';
    return deptName.toLowerCase().trim() === (openingDepartment || '').toLowerCase().trim();
  });

  if (!isEligible) {
    const memberDepts = memberships
      .map((m: any) => m.department?.name)
      .filter(Boolean)
      .join(', ');
    return { 
      error: `Interviewer is scoped to [${memberDepts || 'another department'}] and cannot be assigned to [${openingDepartment || 'this'}] candidates.` 
    };
  }

  // Insert assignment
  const { error } = await supabase
    .from('application_interviewers')
    .insert({ 
      application_id: applicationId, 
      interviewer_id: interviewerId
    })

  if (error) {
    return { error: 'Failed to assign interviewer. Please check permissions and try again.' }
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

    // Fetch application's company_id and department
    const { data: application } = await supabase
      .from('applications')
      .select('opening:openings(company_id, department)')
      .eq('id', appId)
      .single()
      
    const opening = application?.opening as any;
    const companyId = opening?.company_id;
    const openingDepartment = opening?.department;

    if (!companyId) {
      results.failures.push({ applicationId: appId, error: 'Application or company not found.' })
      continue;
    }

    // Verify interviewer is an active member of the company and eligible for the opening department
    const { data: memberships } = await supabase
      .from('interviewer_company_memberships')
      .select('id, department_id, department:departments(id, name)')
      .eq('interviewer_id', interviewerId)
      .eq('company_id', companyId)
      .eq('status', 'active')

    if (!memberships || memberships.length === 0) {
      results.failures.push({ applicationId: appId, error: 'Interviewer has not joined this company.' })
      continue;
    }

    const isEligible = memberships.some((m: any) => {
      if (!m.department_id) return true;
      const deptName = m.department?.name || '';
      return deptName.toLowerCase().trim() === (openingDepartment || '').toLowerCase().trim();
    });

    if (!isEligible) {
      results.failures.push({ 
        applicationId: appId, 
        error: `Interviewer not eligible for [${openingDepartment || 'this'}] candidates.` 
      })
      continue;
    }

    const { error } = await supabase
      .from('application_interviewers')
      .insert({ application_id: appId, interviewer_id: interviewerId })
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
