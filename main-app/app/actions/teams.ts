'use server'

import { createClient } from '@/lib/server'
import { revalidatePath } from 'next/cache'

export async function getDepartments() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('created_at', { ascending: true })

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
  
  const { data, error } = await supabase
    .from('departments')
    .insert([{ name, recruiter_id: user.id }])
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
  const { data, error } = await supabase
    .rpc('get_invitations_with_stats')

  if (error) {
    console.error('Error fetching invitations:', error)
    return []
  }
  return data
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
  const { data, error } = await supabase
    .from('routing_rules')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching routing rules:', error)
    return []
  }
  return data
}

export async function createRoutingRule(departmentId: string, name: string, conditions: any, action: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authorized' }
  
  const openingDept = conditions?.find((c: any) => c.field === 'opening_department')?.value;
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
