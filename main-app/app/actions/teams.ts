'use server'

import { createClient } from '@/lib/server'
import { revalidatePath } from 'next/cache'

export async function getDepartments() {
  const supabase = await createClient()
  const { getActiveCompanyId } = await import('@/app/actions/company');
  const activeCompanyId = await getActiveCompanyId();

  let query = supabase.from('departments').select('*').order('created_at', { ascending: true });
  if (activeCompanyId) {
    query = query.or(`company_id.eq.${activeCompanyId},company_id.is.null`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching departments:', error)
    return []
  }
  return data
}

export async function createDepartment(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authorized' }

  const { getActiveCompanyId } = await import('@/app/actions/company');
  const activeCompanyId = await getActiveCompanyId();
  
  const payload: any = { name, recruiter_id: user.id };
  if (activeCompanyId) {
    payload.company_id = activeCompanyId;
  }

  const { data, error } = await supabase
    .from('departments')
    .insert([payload])
    .select()
    .single()

  if (error) {
    console.error('Error creating department:', error)
    return { error: error.message }
  }
  
  revalidatePath('/recruiter/teams')
  return { data }
}

export async function deleteDepartment(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('departments')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting department:', error)
    return { error: error.message }
  }

  revalidatePath('/recruiter/teams')
  return { success: true }
}

export async function getDepartmentMembers(departmentId: string) {
  const supabase = await createClient()
  // Join with profiles if we need user info, but we don't have access to auth.users from client
  // Wait, profiles only has id, role. Let's see if we can get email. If not, just return IDs.
  const { data, error } = await supabase
    .from('department_members')
    .select('user_id, joined_at:created_at')
    .eq('department_id', departmentId)

  if (error) {
    console.error('Error fetching department members:', error)
    return []
  }
  return data
}

export async function getInvitations() {
  const supabase = await createClient()
  const { getActiveCompanyId } = await import('@/app/actions/company')
  const activeCompanyId = await getActiveCompanyId()

  const { data, error } = await supabase
    .rpc('get_invitations_with_stats')

  if (error) {
    console.error('Error fetching invitations:', error)
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

export async function generateInvitation(departmentId: string, invitedEmail: string | null, expiresInDays: number = 1) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  const payload: any = {
    department_id: departmentId,
    inviter_id: user.id,
    expires_at: expiresAt.toISOString(),
  }

  if (invitedEmail) {
    payload.invited_email = invitedEmail
  }

  const { data, error } = await supabase
    .from('interviewer_invitations')
    .insert([payload])
    .select()
    .single()

  if (error) {
    console.error('Error generating invitation:', error)
    return { error: error.message }
  }
  
  revalidatePath('/recruiter/teams')
  return { data }
}

export async function revokeInvitation(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('interviewer_invitations')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Error revoking invitation:', error)
    return { error: error.message }
  }

  revalidatePath('/recruiter/teams')
  return { success: true }
}

export async function reactivateInvitation(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('interviewer_invitations')
    .update({ revoked_at: null })
    .eq('id', id)

  if (error) {
    console.error('Error reactivating invitation:', error)
    return { error: error.message }
  }

  revalidatePath('/recruiter/teams')
  return { success: true }
}

export async function deleteInvitation(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('interviewer_invitations')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting invitation:', error)
    return { error: error.message }
  }

  revalidatePath('/recruiter/teams')
  return { success: true }
}

export async function getRoutingRules() {
  const supabase = await createClient()
  const { getActiveCompanyId } = await import('@/app/actions/company')
  const activeCompanyId = await getActiveCompanyId()

  let query = supabase
    .from('routing_rules')
    .select('*, department:departments(company_id)')
    .order('created_at', { ascending: true })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching routing rules:', error)
    return []
  }

  // Filter in memory for simplicity if department.company_id exists
  let filteredData = data;
  if (activeCompanyId) {
    filteredData = data.filter((rule: any) => 
      !rule.department || 
      rule.department.company_id === activeCompanyId || 
      rule.department.company_id === null
    );
  }

  return filteredData
}

export async function createRoutingRule(departmentId: string, name: string, conditions: any, action: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authorized' }
  
  const openingDept = conditions?.find((c: any) => c.field === 'opening_department')?.value;

  if (action?.interviewer_id) {
    const { getActiveCompanyId } = await import('@/app/actions/company');
    const activeCompanyId = await getActiveCompanyId();
    if (activeCompanyId) {
      const { data: memberships } = await supabase
        .from('interviewer_company_memberships')
        .select('id, department_id, department:departments(name)')
        .eq('interviewer_id', action.interviewer_id)
        .eq('company_id', activeCompanyId)
        .eq('status', 'active');

      if (!memberships || memberships.length === 0) {
        return { error: 'Selected interviewer has not joined this company.' };
      }

      const isEligible = memberships.some((m: any) => {
        if (!m.department_id) return true;
        const deptName = m.department?.name || '';
        return deptName.toLowerCase().trim() === (openingDept || '').toLowerCase().trim();
      });

      if (!isEligible) {
        return { error: `Interviewer is not eligible for [${openingDept || 'this'}] department candidates.` };
      }
    }
  }

  if (openingDept) {
    const { data: existingRules } = await supabase.from('routing_rules').select('id, conditions');
    const conflictingRule = existingRules?.find(r => 
      Array.isArray(r.conditions) && r.conditions.some((c: any) => c.field === 'opening_department' && c.value === openingDept)
    );
    if (conflictingRule) {
      await supabase.from('routing_rules').delete().eq('id', conflictingRule.id);
    }
  }

  const { data, error } = await supabase
    .from('routing_rules')
    .insert([{ department_id: departmentId, name, conditions, action, recruiter_id: user.id }])
    .select()
    .single()

  if (error) {
    console.error('Error creating routing rule:', error)
    return { error: error.message }
  }

  revalidatePath('/recruiter/teams')
  return { data }
}

export async function deleteRoutingRule(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('routing_rules')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting routing rule:', error)
    return { error: error.message }
  }

  revalidatePath('/recruiter/teams')
  return { success: true }
}

export async function acceptInvitation(token: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.rpc('accept_interviewer_invitation', {
    invite_token: token
  })

  if (error) {
    console.error('Error accepting invitation:', error)
    return { error: error.message }
  }

  return { success: true }
}
