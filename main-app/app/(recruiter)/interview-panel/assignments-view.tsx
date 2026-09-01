import { createClient } from '@/lib/server'
import { AssignmentsTable } from '@/components/interview-panel/assignments-table'

export async function AssignmentsView({ 
  searchParams 
}: { 
  searchParams: { [key: string]: string | string[] | undefined } 
}) {
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

  // To filter by interviewer, it's a many-to-many. 
  // It's tricky to filter directly via PostgREST embedded resources.
  // Instead, we can do an inner join or a separate query. 
  // Since we want server-side filtering without complex RPCs, we can use `!inner` on application_interviewers if interviewer filter is active.
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
    return <div className="p-4 border rounded-md text-destructive bg-destructive/10">Failed to load assignments.</div>
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

  return (
    <div className="space-y-4">
      <AssignmentsTable 
        applications={applications as any || []} 
        totalCount={count || 0}
        currentPage={page}
        pageSize={pageSize}
        allInterviewers={allInterviewers || []}
        departments={departments}
        openings={openingsList || []}
        currentFilters={{ query, department, opening, interviewer, sort }}
      />
    </div>
  )
}
