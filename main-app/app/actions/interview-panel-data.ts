'use server'

import { createClient } from '@/lib/server'

export async function getAssignmentsData(searchParams: { [key: string]: string | string[] | undefined }) {
  const supabase = await createClient()

  const query = typeof searchParams.q === 'string' ? searchParams.q : ''
  const department = typeof searchParams.department === 'string' ? searchParams.department : ''
  const opening = typeof searchParams.opening === 'string' ? searchParams.opening : ''
  const interviewer = typeof searchParams.interviewer === 'string' ? searchParams.interviewer : ''
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'created_at-desc'
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1
  const pageSize = 20
  
  // Base query: applications joined with openings and interviewers
  let dbQuery: any = supabase
    .from('applications')
    .select(`
      id,
      stage,
      candidate_name,
      candidate_email,
      created_at,
      opening:openings!inner(id, title, department),
      interviewers:application_interviewers(
        id,
        interviewer:profiles(id, name)
      )
    `, { count: 'exact' })

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
        opening:openings!inner(id, title, department),
        interviewers:application_interviewers!inner(
          id,
          interviewer_id,
          interviewer:profiles(id, name)
        )
      `, { count: 'exact' })
      .eq('interviewers.interviewer_id', interviewer)

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
  const { data: openingsList } = await supabase
    .from('openings')
    .select('id, title, department')
    .order('title')

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

  // Fetch interviewers and their assigned applications
  const { data: interviewers, error } = await supabase
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
          opening:openings(id, title, department)
        )
      )
    `)
    .eq('role', 'interviewer')
    .order('name')

  if (error) {
    console.error("Error fetching interviewers view:", error)
    throw new Error('Failed to load interviewers')
  }

  return { interviewers: interviewers || [] }
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
