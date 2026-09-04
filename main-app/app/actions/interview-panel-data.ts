'use server'

import { createClient } from '@/lib/server'
import { cookies } from "next/headers"

async function getActiveCompanyId() {
  const cookieStore = await cookies();
  return cookieStore.get('cx_active_company')?.value;
}

export async function getAssignmentsData(searchParams: { [key: string]: string | string[] | undefined }) {
  const supabase = await createClient()

  const query = typeof searchParams.q === 'string' ? searchParams.q : ''
  const department = typeof searchParams.department === 'string' ? searchParams.department : ''
  const opening = typeof searchParams.opening === 'string' ? searchParams.opening : ''
  const interviewer = typeof searchParams.interviewer === 'string' ? searchParams.interviewer : ''
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'created_at-desc'
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1
  const pageSize = 20
  
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

  // Base query: applications joined with openings and interviewers
  let dbQuery: any = supabase
    .from('applications')
    .select(`
      id,
      stage,
      candidate_name,
      candidate_email,
      created_at,
      opening:openings!inner(id, title, department, company_id),
      interviewers:application_interviewers(
        id,
        interviewer:profiles(id, name)
      )
    `, { count: 'exact' })

  if (activeCompanyId) {
    dbQuery = dbQuery.eq('opening.company_id', activeCompanyId);
  }

  // Apply filters
  if (query) {
    dbQuery = dbQuery.ilike('candidate_name', `%${query}%`)
  }
  
  if (department) {
    dbQuery = dbQuery.eq('openings.department', department)
  }

  if (opening) {
    dbQuery = dbQuery.eq('opening_id', opening)
  }

  if (interviewer) {
    dbQuery = supabase
      .from('applications')
      .select(`
        id,
        stage,
        candidate_name,
        candidate_email,
        created_at,
        opening:openings!inner(id, title, department, company_id),
        interviewers:application_interviewers!inner(
          id,
          interviewer_id,
          interviewer:profiles(id, name)
        )
      `, { count: 'exact' })
      .eq('interviewers.interviewer_id', interviewer)

    if (activeCompanyId) dbQuery = dbQuery.eq('opening.company_id', activeCompanyId)
    if (query) dbQuery = dbQuery.ilike('candidate_name', `%${query}%`)
    if (department) dbQuery = dbQuery.eq('openings.department', department)
    if (opening) dbQuery = dbQuery.eq('opening_id', opening)
  }

  // Sorting
  if (sort === 'candidate-asc') {
    dbQuery = dbQuery.order('candidate_name', { ascending: true })
  } else if (sort === 'candidate-desc') {
    dbQuery = dbQuery.order('candidate_name', { ascending: false })
  } else if (sort === 'created_at-asc') {
    dbQuery = dbQuery.order('created_at', { ascending: true })
  } else {
    dbQuery = dbQuery.order('created_at', { ascending: false })
  }

  // Pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  dbQuery = dbQuery.range(from, to)

  const { data: applications, count, error } = await dbQuery

  if (error) {
    console.error("Error fetching assignments:", error)
    throw new Error('Failed to load assignments')
  }

  // Fetch all interviewers for the Add Interviewer dialog and filter dropdowns
  const res = await getActiveCompanyInterviewersList(supabase, activeCompanyId);
  const allInterviewers = res.interviewers || [];

  // Fetch unique departments and openings for filters
  let openingsQuery = supabase
    .from('openings')
    .select('id, title, department, company_id')
    .order('title')

  if (activeCompanyId) {
    openingsQuery = openingsQuery.eq('company_id', activeCompanyId)
  }

  const { data: openingsList } = await openingsQuery

  const departments = Array.from(new Set(openingsList?.map(o => o.department) || [])).sort()

  return {
    applications: applications || [],
    count: count || 0,
    allInterviewers: allInterviewers || [],
    departments,
    openings: openingsList || [],
    page,
    pageSize,
    query,
    department,
    opening,
    interviewer,
    sort
  }
}

async function getActiveCompanyInterviewersList(supabase: any, activeCompanyId?: string | null) {
  let companyId = activeCompanyId;

  if (!companyId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: recMem } = await supabase
        .from('recruiter_company_memberships')
        .select('company_id')
        .eq('recruiter_id', user.id)
        .limit(1)
        .maybeSingle();
      companyId = recMem?.company_id || null;
    }
  }

  // 1. Fetch interviewer memberships for the active company
  let compQuery = supabase
    .from('interviewer_company_memberships')
    .select('interviewer_id, department_id, status');
  if (companyId) {
    compQuery = compQuery.eq('company_id', companyId);
  }
  const { data: compMemberships } = await compQuery;

  // 2. Fetch all departments belonging to this company or created for it
  const { data: companyDepts } = await supabase
    .from('departments')
    .select('id, name, company_id');
  
  const deptNameMap = new Map<string, string>();
  const relevantDeptIds: string[] = [];
  (companyDepts || []).forEach((d: any) => {
    deptNameMap.set(d.id, d.name);
    if (!companyId || !d.company_id || d.company_id === companyId) {
      relevantDeptIds.push(d.id);
    }
  });

  // 3. Fetch from department_members (legacy / direct department members)
  let deptMembers: any[] = [];
  if (relevantDeptIds.length > 0) {
    const { data: dm } = await supabase
      .from('department_members')
      .select('user_id, department_id')
      .in('department_id', relevantDeptIds);
    deptMembers = dm || [];
  }

  // 4. Fetch from application_interviewers for candidates in this company's openings
  let appQuery = supabase
    .from('application_interviewers')
    .select(`
      interviewer_id,
      application_id,
      application:applications!inner(
        id,
        candidate_name,
        stage,
        opening:openings!inner(id, title, department, company_id)
      )
    `);
  if (companyId) {
    appQuery = appQuery.eq('application.opening.company_id', companyId);
  }
  const { data: appInterviewers } = await appQuery;

  // Collect all unique interviewer user IDs across all sources
  const allInterviewerIds = new Set<string>();
  (compMemberships || []).forEach((m: any) => allInterviewerIds.add(m.interviewer_id));
  deptMembers.forEach((m: any) => allInterviewerIds.add(m.user_id));
  (appInterviewers || []).forEach((a: any) => allInterviewerIds.add(a.interviewer_id));

  if (allInterviewerIds.size === 0) {
    return { interviewers: [] };
  }

  // Fetch profiles for all identified interviewers
  const { data: profiles, error: profError } = await supabase
    .from('profiles')
    .select('id, name, role')
    .in('id', Array.from(allInterviewerIds))
    .order('name');

  if (profError) {
    console.error("Error fetching interviewer profiles:", profError);
    return { interviewers: [] };
  }

  // Auto-sync any legacy department members into interviewer_company_memberships
  for (const dm of deptMembers) {
    if (!compMemberships?.some((m: any) => m.interviewer_id === dm.user_id)) {
      try {
        await supabase
          .from('interviewer_company_memberships')
          .insert([{
            company_id: activeCompanyId,
            interviewer_id: dm.user_id,
            department_id: dm.department_id,
            status: 'active'
          }]);
      } catch {
        // Ignore if already exists or conflict
      }
    }
  }

  const interviewers = (profiles || [])
    .filter((profile: any) => profile.role !== 'recruiter')
    .map((profile: any) => {
    const mems = (compMemberships || []).filter((m: any) => m.interviewer_id === profile.id);
    const legacyMems = deptMembers.filter((m: any) => m.user_id === profile.id);

    const deptNames = new Set<string>();
    let isCompanyWide = false;

    if (mems.length > 0) {
      mems.forEach((m: any) => {
        if (!m.department_id) {
          isCompanyWide = true;
        } else {
          const name = deptNameMap.get(m.department_id);
          if (name) deptNames.add(name);
        }
      });
    }

    legacyMems.forEach((lm: any) => {
      const name = deptNameMap.get(lm.department_id);
      if (name) deptNames.add(name);
    });

    if (mems.length === 0 && legacyMems.length === 0) {
      isCompanyWide = true;
    }

    const depts = Array.from(deptNames);
    const scopeLabel = isCompanyWide ? 'Company-Wide' : (depts.join(', ') || 'Company-Wide');

    const assignments = (appInterviewers || [])
      .filter((a: any) => a.interviewer_id === profile.id)
      .map((a: any) => ({
        application_id: a.application?.id,
        application: a.application
      }));

    return {
      id: profile.id,
      name: profile.name || 'Unnamed Interviewer',
      isCompanyWide,
      departments: depts,
      scopeLabel,
      application_interviewers: assignments
    };
  });

  return { interviewers };
}

export async function getInterviewersData() {
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

  if (!activeCompanyId) {
    return { interviewers: [] }
  }

  return await getActiveCompanyInterviewersList(supabase, activeCompanyId);
}

export async function getUpcomingInterviews(limit: number = 5) {
  const supabase = await createClient()

  // Fetch upcoming interviews from the newly created interviews table
  const { data, error } = await supabase
    .from('interviews')
    .select(`
      id,
      scheduled_at,
      application:applications(
        id,
        candidate_name,
        opening:openings(id, title),
        interviewers:application_interviewers(
          interviewer:profiles(id, name)
        )
      )
    `)
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(limit)

  if (error) {
    console.error("Error fetching upcoming interviews:", error)
    return { data: [], error: 'Failed to load upcoming interviews' }
  }

  // Flatten relationships properly
  const formattedData = (data || []).map((item: any) => ({
    id: item.id as string,
    scheduled_at: item.scheduled_at as string,
    candidate_name: item.application?.candidate_name as string,
    opening_title: item.application?.opening?.title as string,
    interviewers: item.application?.interviewers?.map((i: any) => i.interviewer?.name).filter(Boolean) as string[],
    application_id: item.application?.id as string,
  }))

  return { data: formattedData, error: null }
}
