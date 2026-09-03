'use server'

import { createClient } from '@/lib/server'
import { getActiveCompanyId } from '@/app/actions/company'

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

export type ApplicantHistorySummary = {
  id: string
  candidate_name: string
  candidate_email: string
  stage: string
  created_at: string
  updated_at: string
  opening_title: string
  opening_department: string
  history_count: number
  latest_event: ApplicationHistoryEvent | null
  history: ApplicationHistoryEvent[]
}

export async function getGlobalHistory(page: number = 1, limit: number = 50) {
  const supabase = await createClient()

  // Calculate pagination offsets
  const from = (page - 1) * limit
  const to = from + limit - 1

  let activeCompanyId = await getActiveCompanyId();
  if (!activeCompanyId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: recMem } = await supabase
        .from('recruiter_company_memberships')
        .select('company_id')
        .eq('recruiter_id', user.id)
        .limit(1)
        .maybeSingle();
      activeCompanyId = recMem?.company_id || null;
    }
  }

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

  const formattedData: ApplicationHistoryEvent[] = (data || []).map((item: any) => ({
    ...item,
    actor: Array.isArray(item.actor) ? item.actor[0] : item.actor,
    application: Array.isArray(item.application) ? item.application[0] : item.application,
  }))

  return { data: formattedData, count: count || 0 }
}

export async function getApplicantsWithHistory(): Promise<{ data: ApplicantHistorySummary[]; error?: string }> {
  const supabase = await createClient()
  let activeCompanyId = await getActiveCompanyId();

  if (!activeCompanyId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: recMem } = await supabase
        .from('recruiter_company_memberships')
        .select('company_id')
        .eq('recruiter_id', user.id)
        .limit(1)
        .maybeSingle();
      activeCompanyId = recMem?.company_id || null;
    }
  }

  // Fetch all company departments to resolve any UUIDs stored in openings.department to human-readable names
  const { data: allDepts } = await supabase
    .from('departments')
    .select('id, name');

  const deptMap = new Map<string, string>();
  (allDepts || []).forEach((d: any) => {
    if (d.id && d.name) {
      deptMap.set(d.id, d.name);
      deptMap.set(d.id.toLowerCase(), d.name);
    }
  });

  let query = supabase
    .from('applications')
    .select(`
      id,
      candidate_name,
      candidate_email,
      stage,
      created_at,
      updated_at,
      opening:openings!inner(id, title, department, company_id),
      history:application_history(
        id,
        application_id,
        actor_id,
        event_type,
        details,
        created_at,
        actor:profiles(name)
      )
    `)
    .order('updated_at', { ascending: false });

  if (activeCompanyId) {
    query = query.eq('opening.company_id', activeCompanyId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching applicants with history:", error);
    return { data: [], error: error.message };
  }

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const applicants: ApplicantHistorySummary[] = (data || []).map((app: any) => {
    const sortedHistory: ApplicationHistoryEvent[] = (app.history || [])
      .map((h: any) => ({
        ...h,
        actor: Array.isArray(h.actor) ? h.actor[0] : h.actor,
        application: {
          candidate_name: app.candidate_name,
          opening: { title: app.opening?.title }
        }
      }))
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Resolve human-readable department name instead of UUID
    const rawDept = app.opening?.department;
    let resolvedDepartment = 'General';
    if (rawDept) {
      if (deptMap.has(rawDept) || deptMap.has(rawDept.toLowerCase())) {
        resolvedDepartment = deptMap.get(rawDept) || deptMap.get(rawDept.toLowerCase()) || rawDept;
      } else if (!uuidPattern.test(rawDept)) {
        resolvedDepartment = rawDept;
      }
    }

    return {
      id: app.id,
      candidate_name: app.candidate_name || 'Unnamed Candidate',
      candidate_email: app.candidate_email || '',
      stage: app.stage || 'applied',
      created_at: app.created_at,
      updated_at: app.updated_at,
      opening_title: app.opening?.title || 'Unknown Role',
      opening_department: resolvedDepartment,
      history_count: sortedHistory.length,
      latest_event: sortedHistory[0] || null,
      history: sortedHistory
    };
  });

  return { data: applicants };
}

export async function getApplicationHistory(applicationId: string): Promise<{ data: ApplicationHistoryEvent[]; error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase
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
    `)
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching application history:", error)
    return { data: [], error: 'Failed to load application history' }
  }

  const formattedData: ApplicationHistoryEvent[] = (data || []).map((item: any) => ({
    ...item,
    actor: Array.isArray(item.actor) ? item.actor[0] : item.actor,
    application: Array.isArray(item.application) ? item.application[0] : item.application,
  }))

  return { data: formattedData }
}
