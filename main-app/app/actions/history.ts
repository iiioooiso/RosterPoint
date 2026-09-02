'use server'

import { createClient } from '@/lib/server'
import { cookies } from "next/headers"

async function getActiveCompanyId() {
  const cookieStore = await cookies();
  return cookieStore.get('cx_active_company')?.value;
}

export type ApplicationHistoryEvent = {
  id: string
  application_id: string
  actor_id: string | null
  event_type: string
  details: any
  created_at: string
  actor?: {
    name: string
  } | null
  application?: {
    candidate_name: string
    opening?: {
      title: string
    } | null
  } | null
}

export async function getGlobalHistory(page: number = 1, limit: number = 50) {
  const supabase = await createClient()

  // Calculate pagination offsets
  const from = (page - 1) * limit
  const to = from + limit - 1

  const activeCompanyId = await getActiveCompanyId();

  let query = supabase
    .from('application_history')
    .select(`
      id,
      application_id,
      actor_id,
      event_type,
      details,
      created_at,
      actor:profiles(name),
      application:applications!inner(candidate_name, opening:openings!inner(title, company_id))
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (activeCompanyId) {
    query = query.eq('application.opening.company_id', activeCompanyId);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("Error fetching global history:", error)
    return { data: [], count: 0, error: 'Failed to load history' }
  }

  // Supabase returns related objects as an array when it's a one-to-one or one-to-many depending on schema,
  // but since these are foreign keys, it usually returns a single object if configured properly,
  // except sometimes it returns arrays if the relation isn't strictly singular. We'll cast carefully.
  const formattedData: ApplicationHistoryEvent[] = (data || []).map((item: any) => ({
    ...item,
    actor: Array.isArray(item.actor) ? item.actor[0] : item.actor,
    application: Array.isArray(item.application) ? item.application[0] : item.application,
  }))

  return { data: formattedData, count: count || 0 }
}
