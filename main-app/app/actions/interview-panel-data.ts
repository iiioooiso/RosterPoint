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
  
  const activeCompanyId = await getActiveCompanyId();

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
      ),
      requests:interview_requests(
        id,
        status,
        interviewer:profiles!interview_requests_interviewer_id_fkey(id, name)
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
        ),
        requests:interview_requests(
          id,
          status,
          interviewer:profiles!interview_requests_interviewer_id_fkey(id, name)
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

  // Also fetch all interviewers for the Add Interviewer dialog and filter dropdowns
  const { data: allInterviewers } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('role', 'interviewer')
    .order('name')

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

export async function getInterviewersData() {
  const supabase = await createClient()
  const activeCompanyId = await getActiveCompanyId();

  let validInterviewerIds: string[] | null = null;

  if (activeCompanyId) {
    // 1. Get all recruiters in the active company
    const { data: companyRecruiters } = await supabase
      .from('recruiter_company_memberships')
      .select('recruiter_id')
      .eq('company_id', activeCompanyId);
    
    const recruiterIds = companyRecruiters?.map(r => r.recruiter_id) || [];

    // 2. Get all departments created by these recruiters
    let departmentIds: string[] = [];
    if (recruiterIds.length > 0) {
      const { data: companyDepartments } = await supabase
        .from('departments')
        .select('id')
        .in('recruiter_id', recruiterIds);
      departmentIds = companyDepartments?.map(d => d.id) || [];
    }

    // 3. Get all interviewers in these departments
    if (departmentIds.length > 0) {
      const { data: departmentMembers } = await supabase
        .from('department_members')
        .select('user_id')
        .in('department_id', departmentIds);
      validInterviewerIds = Array.from(new Set(departmentMembers?.map(m => m.user_id) || []));
    } else {
      validInterviewerIds = [];
    }
  }

  // If we are filtering by company and there are no valid interviewers, return empty early
  if (activeCompanyId && validInterviewerIds && validInterviewerIds.length === 0) {
    return { interviewers: [] }
  }

  // Fetch interviewers and their assigned applications
  let dbQuery = supabase
    .from('profiles')
    .select(`
      id,
      name,
      application_interviewers(
        application_id,
        application:applications(
          id,
          candidate_name,
          stage,
          opening:openings(id, title, department, company_id)
        )
      )
    `)
    .eq('role', 'interviewer')
    .order('name')

  if (validInterviewerIds && validInterviewerIds.length > 0) {
    dbQuery = dbQuery.in('id', validInterviewerIds);
  }

  const { data: interviewers, error } = await dbQuery

  if (error) {
    console.error("Error fetching interviewers view:", error)
    throw new Error('Failed to load interviewers')
  }

  // Filter application_interviewers to only those in the active company, just in case
  const filteredInterviewers = (interviewers || []).map((interviewer: any) => {
    if (!activeCompanyId) return interviewer;
    
    return {
      ...interviewer,
      application_interviewers: (interviewer.application_interviewers || []).filter((assignment: any) => 
        assignment.application?.opening?.company_id === activeCompanyId
      )
    };
  });

  return { interviewers: filteredInterviewers }
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
