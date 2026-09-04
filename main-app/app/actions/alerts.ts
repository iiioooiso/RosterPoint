'use server'

import { createClient } from '@/lib/server'
import { revalidatePath } from 'next/cache'
import { cookies } from "next/headers"

async function getActiveCompanyId() {
  const cookieStore = await cookies();
  return cookieStore.get('cx_active_company')?.value;
}

export async function getAlerts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated', alerts: [] }
  }

  // 10 days ago
  const tenDaysAgo = new Date()
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)

  // Fetch stalled applications where stage is active
  const activeCompanyId = await getActiveCompanyId();

  let query = supabase
    .from('applications')
    .select(`
      id,
      stage,
      stage_updated_at,
      candidate_name,
      opening:openings!inner(id, title, company_id),
      alert_dismissals(application_id)
    `)
    .lte('stage_updated_at', tenDaysAgo.toISOString())
    .not('stage', 'in', '("rejected","withdrawn")')
    .order('stage_updated_at', { ascending: true });

  if (activeCompanyId) {
    query = query.eq('opening.company_id', activeCompanyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching alerts:", error)
    return { error: 'Failed to fetch alerts', alerts: [] }
  }

  const activeAlerts = (data || []).filter((app: any) => (app.alert_dismissals || []).length === 0)

  const formattedAlerts = activeAlerts.map((app: any) => ({
    id: app.id as string,
    stage: app.stage as string,
    stage_updated_at: app.stage_updated_at as string,
    candidate_name: app.candidate_name as string,
    opening: (Array.isArray(app.opening) ? app.opening[0] : app.opening) as { id: string; title: string },
  }))

  return { alerts: formattedAlerts }
}

export async function getAlertsCount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { count: 0 }
  }

  const tenDaysAgo = new Date()
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)

  // We can't cleanly do a count with a joined NOT EXISTS filter just using the standard JS client .count() easily
  // without getting the rows. Given this is a dashboard, fetching the IDs is lightweight enough.
  const activeCompanyId = await getActiveCompanyId();
  
  let query = supabase
    .from('applications')
    .select(`
      id,
      opening:openings!inner(id, company_id),
      alert_dismissals(application_id)
    `)
    .lte('stage_updated_at', tenDaysAgo.toISOString())
    .not('stage', 'in', '("rejected","withdrawn")');

  if (activeCompanyId) {
    query = query.eq('opening.company_id', activeCompanyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching alerts count:", error)
    return { count: 0 }
  }

  const count = (data || []).filter((app: any) => app.alert_dismissals.length === 0).length

  return { count }
}

export async function dismissAlert(applicationId: string, stage: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('alert_dismissals')
    .insert({
      application_id: applicationId,
      stage: stage,
      dismissed_by: user.id
    })

  if (error) {
    console.error("Error dismissing alert:", error)
    return { error: 'Failed to dismiss alert' }
  }

  revalidatePath('/recruiter/alerts')
  revalidatePath('/recruiter', 'layout') // Revalidate the sidebar badge across recruiter layout
  return { success: true }
}
