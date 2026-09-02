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

  // 1. Fetch opening and student profile
  const { data: opening } = await supabase
    .from('openings')
    .select('department, recruiter_id, application_materials')
    .eq('id', openingId)
    .maybeSingle();

  const { data: studentProfile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .maybeSingle();

  const candidateName = studentProfile?.name || (user.user_metadata?.full_name as string) || (user.email ? user.email.split('@')[0] : 'Candidate');
  const candidateEmail = user.email || null;

  const materials = opening?.application_materials as any;
  const isResumeRequired = materials?.resume?.required ?? true;
  const resume = formData.get('resume') as File | null;
  const hasResume = !!(resume && resume.size > 0 && resume.name);

  if (isResumeRequired && !hasResume) {
    return { error: 'Resume is required.' };
  }

  // 1.5 Upload resume to Supabase Storage if provided
  let storagePath: string | null = null;
  if (hasResume && resume) {
    const fileExt = resume.name.split('.').pop() || 'pdf';
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    storagePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('application-documents')
      .upload(storagePath, resume);

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return { error: 'Failed to upload resume. Please try again.' };
    }
  }

  // 2. Evaluate Routing Rules
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

  // 3. Collect extra responses (cover letter, portfolio, custom questions)
  const coverLetter = (formData.get('cover_letter') as string)?.trim() || null;
  const portfolio = (formData.get('portfolio') as string)?.trim() || null;
  const questionsList: { id?: string; title: string; answer: string; type?: string }[] = [];

  if (materials?.custom_questions && Array.isArray(materials.custom_questions)) {
    for (const q of materials.custom_questions) {
      const val = formData.get(`custom_${q.id}`);
      if (typeof val === 'string' && val.trim()) {
        questionsList.push({
          id: q.id,
          title: q.title,
          type: q.type,
          answer: val.trim()
        });
      }
    }
  }

  const candidateResponses = {
    portfolio: portfolio,
    cover_letter: coverLetter,
    questions: questionsList
  };

  // 4. Create the application record
  const { data: application, error: appError } = await supabase
    .from('applications')
    .insert({
      student_id: user.id,
      opening_id: openingId,
      stage: 'applied',
      routed_department_id: routedDeptId,
      candidate_name: candidateName,
      candidate_email: candidateEmail,
      source: 'Direct Application',
      candidate_responses: candidateResponses,
      notes: null,
    })
    .select()
    .single();

  if (appError) {
    console.error("Application insert error:", appError);
    if (storagePath) {
      await supabase.storage.from('application-documents').remove([storagePath]);
    }
    return { error: 'Failed to submit application.' };
  }

  // 5. Create the document record if resume uploaded
  if (hasResume && resume && storagePath && application) {
    const { error: docError } = await supabase
      .from('documents')
      .insert({
        student_id: user.id,
        application_id: application.id,
        type: 'resume',
        storage_path: storagePath,
        filename: resume.name,
        content_type: resume.type || 'application/pdf',
      });

    if (docError) {
      console.error("Document insert error:", docError);
    }
  }

  revalidatePath(`/careers/${openingId}`);
  revalidatePath('/student/dashboard');
  revalidatePath('/recruiter/applicants');
  
  return { success: true };
}

export async function updateApplicationStage(applicationId: string, newStage: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get current application stage to enforce pipeline rules
  const { data: currentApp, error: fetchErr } = await supabase
    .from('applications')
    .select('stage')
    .eq('id', applicationId)
    .single()

  if (fetchErr || !currentApp) {
    return { error: 'Application not found' }
  }

  const currentStage = currentApp.stage
  const STAGE_ORDER = ['applied', 'screening', 'interview', 'offer', 'hired']

  if (newStage === currentStage) {
    return { success: true }
  }

  // 1. Rejection allowed from any stage
  if (newStage === 'rejected') {
    const { error } = await supabase
      .from('applications')
      .update({ stage: 'rejected' })
      .eq('id', applicationId)

    if (error) return { error: error.message }
    revalidatePath('/recruiter/applicants')
    revalidatePath(`/recruiter/applicants/${applicationId}`)
    return { success: true }
  }

  // 2. Reinstatement from rejected stage
  if (currentStage === 'rejected') {
    const { data: lastRejectedEvent } = await supabase
      .from('application_history')
      .select('details')
      .eq('application_id', applicationId)
      .eq('event_type', 'application_rejected')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const fromStage = lastRejectedEvent?.details?.from_stage
    if (fromStage && newStage !== fromStage) {
      return {
        error: `Cannot reinstate to "${newStage}". A rejected application must be reinstated to the exact stage it was rejected from: "${fromStage}".`
      }
    }

    const { error } = await supabase
      .from('applications')
      .update({ stage: newStage })
      .eq('id', applicationId)

    if (error) return { error: error.message }
    revalidatePath('/recruiter/applicants')
    revalidatePath(`/recruiter/applicants/${applicationId}`)
    return { success: true }
  }

  // 3. Sequential stage progression (Applied -> Screening -> Interview -> Offer -> Hired)
  const currentIdx = STAGE_ORDER.indexOf(currentStage)
  const newIdx = STAGE_ORDER.indexOf(newStage)

  if (currentIdx === -1 || newIdx === -1) {
    return { error: `Invalid stage: ${newStage}` }
  }

  if (newIdx > currentIdx + 1) {
    const nextExpected = STAGE_ORDER[currentIdx + 1]
    return {
      error: `Cannot skip stages forward. Applications must advance one stage at a time (${currentStage} → ${nextExpected}). Skipping to ${newStage} is not permitted.`
    }
  }

  if (newIdx < currentIdx) {
    return {
      error: `Applications cannot move backward in the pipeline (${currentStage} → ${newStage}).`
    }
  }

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
