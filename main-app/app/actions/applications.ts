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
    .select('department, recruiter_id, application_materials, company_id')
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
  let targetInterviewerId = null;
  if (opening) {
    const { data: rules } = await supabase
      .from('routing_rules')
      .select('department_id, conditions, action')
      .eq('recruiter_id', opening.recruiter_id)
      .eq('is_active', true);

    const matchingRule = rules?.find(rule => {
      const conditions = rule.conditions as any[];
      return Array.isArray(conditions) && conditions.some(c => c.field === 'opening_department' && c.value === opening.department);
    });

    if (matchingRule) {
      routedDeptId = matchingRule.department_id;
      const action = matchingRule.action as any;
      if (action?.interviewer_id) {
        // Validate interviewer eligibility server-side before assigning
        const { data: memberships } = await supabase
          .from('interviewer_company_memberships')
          .select('id, department_id, department:departments(name)')
          .eq('interviewer_id', action.interviewer_id)
          .eq('company_id', opening.company_id)
          .eq('status', 'active');

        if (memberships && memberships.length > 0) {
          const isEligible = memberships.some((m: any) => {
            if (!m.department_id) return true; // Company-wide
            const deptName = m.department?.name || '';
            return deptName.toLowerCase().trim() === (opening.department || '').toLowerCase().trim();
          });
          if (isEligible) {
            targetInterviewerId = action.interviewer_id;
          }
        }
      }
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

  // If a routing rule routed to an eligible interviewer, assign them immediately
  if (targetInterviewerId && application) {
    await supabase.from('application_interviewers').insert({
      application_id: application.id,
      interviewer_id: targetInterviewerId
    });
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
  // If the path is already a full URL, just return it directly (useful for local seed data pointing to a remote file)
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return { url: storagePath }
  }

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

export type BulkUpdateResult = { id: string, name: string, status: 'success' | 'error', reason?: string };

export async function bulkUpdateApplications(applicationIds: string[], actionType: 'advance' | 'reject'): Promise<BulkUpdateResult[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return applicationIds.map(id => ({ id, name: 'Unknown', status: 'error', reason: 'Not authenticated' }));
  }

  // Fetch applications to get current stages and names
  const { data: applications, error: fetchErr } = await supabase
    .from('applications')
    .select('id, stage, candidate_name')
    .in('id', applicationIds);

  if (fetchErr || !applications) {
    return applicationIds.map(id => ({ id, name: 'Unknown', status: 'error', reason: 'Failed to fetch application' }));
  }

  const STAGE_ORDER = ['applied', 'screening', 'interview', 'offer', 'hired'];
  const results: BulkUpdateResult[] = [];
  
  for (const app of applications) {
    const currentStage = app.stage;
    const candidateName = app.candidate_name || 'Unknown Candidate';
    
    let targetStage: string | null = null;

    if (actionType === 'reject') {
      if (currentStage === 'rejected') {
        results.push({ id: app.id, name: candidateName, status: 'error', reason: 'Already rejected' });
        continue;
      }
      targetStage = 'rejected';
    } else if (actionType === 'advance') {
      if (currentStage === 'rejected') {
        results.push({ id: app.id, name: candidateName, status: 'error', reason: 'Cannot advance a rejected application' });
        continue;
      }
      
      const currentIdx = STAGE_ORDER.indexOf(currentStage);
      if (currentIdx === -1 || currentIdx >= STAGE_ORDER.length - 1) {
        results.push({ id: app.id, name: candidateName, status: 'error', reason: 'No next stage available' });
        continue;
      }
      targetStage = STAGE_ORDER[currentIdx + 1];
    }

    if (!targetStage) continue;

    // Call existing update logic internally which handles validation and history
    const result = await updateApplicationStage(app.id, targetStage);
    
    if (result.error) {
      results.push({ id: app.id, name: candidateName, status: 'error', reason: result.error });
    } else {
      results.push({ id: app.id, name: candidateName, status: 'success' });
    }
  }

  // Fallback for IDs not found
  const foundIds = new Set(applications.map(a => a.id));
  for (const id of applicationIds) {
    if (!foundIds.has(id)) {
      results.push({ id, name: 'Unknown', status: 'error', reason: 'Application not found' });
    }
  }

  revalidatePath('/recruiter/applicants');
  return results;
}

export async function exportPipelineCSV(companyId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('applications')
    .select(`
      id,
      candidate_name,
      candidate_email,
      stage,
      created_at,
      source,
      opening:openings!inner(title, company_id)
    `)
    .eq('opening.company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  if (!data || data.length === 0) {
    return { error: 'No applications found to export.' };
  }

  // Generate CSV string
  const headers = ['ID', 'Candidate Name', 'Email', 'Opening', 'Stage', 'Applied Date', 'Source'];
  const rows = data.map(app => [
    app.id,
    `"${app.candidate_name || ''}"`,
    `"${app.candidate_email || ''}"`,
    `"${(app.opening as any)?.title || ''}"`,
    app.stage,
    new Date(app.created_at).toISOString().split('T')[0],
    `"${app.source || ''}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  return { csv: csvContent };
}
