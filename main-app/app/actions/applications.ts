'use server'

import { createClient } from '@/lib/server'
import { revalidatePath } from 'next/cache'

export async function hasStudentApplied(openingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const { data, error } = await supabase
    .from('applications')
    .select('id')
    .eq('student_id', user.id)
    .eq('opening_id', openingId)
    .maybeSingle()

  if (error) {
    console.error("Error checking application status:", error)
    return false
  }

  return !!data
}

export async function submitApplication(openingId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to apply.' }
  }

  // Check if they already applied
  const alreadyApplied = await hasStudentApplied(openingId)
  if (alreadyApplied) {
    return { error: 'You have already applied to this opening.' }
  }

  const resume = formData.get('resume') as File
  if (!resume) {
    return { error: 'Resume is required.' }
  }

  // 1. Upload resume to Supabase Storage
  const fileExt = resume.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${fileExt}`
  const storagePath = `${user.id}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('application-documents')
    .upload(storagePath, resume)

  if (uploadError) {
    console.error("Storage upload error:", uploadError)
    return { error: 'Failed to upload resume. Please try again.' }
  }

  // 1.5 Evaluate Routing Rules
  const { data: opening } = await supabase
    .from('openings')
    .select('department, recruiter_id')
    .eq('id', openingId)
    .single();

  let routedDeptId = null;
  if (opening) {
    const { data: rules } = await supabase
      .from('routing_rules')
      .select('department_id, conditions')
      .eq('recruiter_id', opening.recruiter_id)
      .eq('is_active', true);

    const matchingRule = rules?.find(rule => {
      const conditions = rule.conditions as any[];
      return Array.isArray(conditions) && conditions.some(c => c.field === 'opening_department' && c.value === opening.department);
    });

    if (matchingRule) {
      routedDeptId = matchingRule.department_id;
    }
  }

  // 2. Create the application record
  const { data: application, error: appError } = await supabase
    .from('applications')
    .insert({
      student_id: user.id,
      opening_id: openingId,
      stage: 'applied',
      routed_department_id: routedDeptId
    })
    .select()
    .single()

  if (appError) {
    console.error("Application insert error:", appError)
    // Attempt to clean up the uploaded file
    await supabase.storage.from('application-documents').remove([storagePath])
    return { error: 'Failed to submit application.' }
  }

  // 3. Create the document record
  const { error: docError } = await supabase
    .from('documents')
    .insert({
      student_id: user.id,
      application_id: application.id,
      type: 'resume',
      storage_path: storagePath,
      filename: resume.name,
      content_type: resume.type,
    })

  if (docError) {
    console.error("Document insert error:", docError)
    // We won't roll back the application, but it's missing the doc link. 
    // In a real app, you'd use a transaction or RPC.
    return { error: 'Application submitted, but failed to link resume.' }
  }

  revalidatePath(`/careers/${openingId}`)
  revalidatePath('/student/dashboard')
  
  return { success: true }
}

export async function updateApplicationStage(applicationId: string, newStage: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('applications')
    .update({ stage: newStage })
    .eq('id', applicationId)
    
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/recruiter/applicants')
  revalidatePath(`/recruiter/applicants/${applicationId}`)
  return { success: true }
}

export async function generateDocumentSignedUrl(storagePath: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.storage
    .from('application-documents')
    .createSignedUrl(storagePath, 60 * 5) // 5 minutes
    
  if (error) {
    console.error("Error creating signed URL:", error)
    return { error: 'Could not generate access URL.' }
  }
  
  return { url: data.signedUrl }
}
