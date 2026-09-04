'use server'

import { createClient } from '@/lib/server'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'
import { getActiveCompanyId } from '@/app/actions/company'

export async function getCompanyInvitations() {
  const supabase = await createClient()
  const activeCompanyId = await getActiveCompanyId()

  const { data, error } = await supabase
    .rpc('get_company_invitations_with_stats')

  if (error) {
    console.error('Error fetching company invitations:', error)
    return []
  }

  let filteredData = data;
  if (activeCompanyId) {
    filteredData = data.filter((inv: any) => 
      !inv.company_id || inv.company_id === activeCompanyId
    );
  }

  return filteredData
}

export async function generateCompanyInvitation(
  companyId?: string | null, 
  invitedEmail?: string | null, 
  expiresInDays: number = 1,
  departmentId?: string | null
) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  let targetCompanyId = companyId;
  if (!targetCompanyId) {
    targetCompanyId = await getActiveCompanyId();
  }

  if (!targetCompanyId) {
    return { error: 'No active company found. Please select or create a company first.' }
  }

  // Ensure recruiter belongs to this company
  const { data: membership } = await supabase
    .from('recruiter_company_memberships')
    .select('id')
    .eq('recruiter_id', user.id)
    .eq('company_id', targetCompanyId)
    .maybeSingle();

  if (!membership) {
    return { error: 'Not authorized to invite for this company' }
  }

  // Validate department belongs to target company
  if (departmentId) {
    const { data: dept } = await supabase
      .from('departments')
      .select('id, name, company_id')
      .eq('id', departmentId)
      .maybeSingle();

    if (!dept) {
      return { error: 'Department not found' };
    }

    if (dept.company_id && dept.company_id !== targetCompanyId) {
      return { error: 'Department does not belong to the selected company.' };
    }
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  const token = crypto.randomUUID()

  const payload: any = {
    company_id: targetCompanyId,
    inviter_id: user.id,
    expires_at: expiresAt.toISOString(),
    token: token,
    department_id: departmentId || null
  }

  if (invitedEmail) {
    payload.invited_email = invitedEmail.trim()
  }

  const { data, error } = await supabase
    .from('company_invitations')
    .insert([payload])
    .select()
    .single()

  if (error) {
    console.error('Error generating company invitation:', error)
    return { error: error.message }
  }
  
  revalidatePath('/recruiter/teams')
  return { data }
}

export async function revokeCompanyInvitation(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('company_invitations')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error revoking company invitation:', error)
    return { error: error.message }
  }

  revalidatePath('/recruiter/teams')
  return { success: true }
}

export async function acceptCompanyInvitation(token: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase.rpc('accept_company_invitation', { token })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/interviewer/dashboard')
  return { success: true }
}
