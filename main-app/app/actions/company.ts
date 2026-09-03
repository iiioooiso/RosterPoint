'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/server'

export async function setActiveCompany(companyId: string) {
  const cookieStore = await cookies();
  cookieStore.set('cx_active_company', companyId, { path: '/' });
}

export async function getActiveCompanyId() {
  const cookieStore = await cookies();
  const cookieVal = cookieStore.get('cx_active_company')?.value;
  if (cookieVal) return cookieVal;

  // Fallback to the user's primary company membership
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Check recruiter membership
    const { data: recruiterMem } = await supabase
      .from('recruiter_company_memberships')
      .select('company_id')
      .eq('recruiter_id', user.id)
      .limit(1)
      .maybeSingle();

    if (recruiterMem?.company_id) {
      return recruiterMem.company_id;
    }

    // Check interviewer membership
    const { data: interviewerMem } = await supabase
      .from('interviewer_company_memberships')
      .select('company_id')
      .eq('interviewer_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    if (interviewerMem?.company_id) {
      return interviewerMem.company_id;
    }
  } catch (err) {
    console.error('Error fetching default active company:', err);
  }

  return null;
}
