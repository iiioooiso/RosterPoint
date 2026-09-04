import { createClient } from "@/lib/server"
import { getActiveCompanyId } from '@/app/actions/company'
import { ApplicantsListClient } from "./_components/ApplicantsListClient"

export default async function ApplicantsPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const activeCompanyId = await getActiveCompanyId()
  const resolvedSearchParams = await searchParams;

  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page) : 1
  const limit = 10
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('applications')
    .select(`
      id, 
      created_at, 
      stage, 
      student_id,
      candidate_name,
      candidate_email,
      source,
      opening:openings!inner(id, title, department, company_id)
    `, { count: 'exact' })

  if (activeCompanyId) {
    query = query.eq('opening.company_id', activeCompanyId)
  }

  // Handle Search
  if (typeof resolvedSearchParams.q === 'string' && resolvedSearchParams.q.length > 0) {
    query = query.or(`candidate_name.ilike.%${resolvedSearchParams.q}%,candidate_email.ilike.%${resolvedSearchParams.q}%`)
  }

  // Handle Filters
  if (typeof resolvedSearchParams.opening === 'string' && resolvedSearchParams.opening !== '') {
    query = query.eq('opening_id', resolvedSearchParams.opening)
  }
  
  if (typeof resolvedSearchParams.stage === 'string' && resolvedSearchParams.stage !== '') {
    query = query.eq('stage', resolvedSearchParams.stage)
  }

  // Handle Sorting
  const sort = typeof resolvedSearchParams.sort === 'string' ? resolvedSearchParams.sort : 'created_at-desc'
  const [sortField, sortDirection] = sort.split('-')
  
  if (sortField && sortDirection) {
    query = query.order(sortField, { ascending: sortDirection === 'asc' })
  } else {
    query = query.order('created_at', { ascending: false }) // Fallback
  }

  // Apply Pagination
  query = query.range(from, to)

  const { data: applications, error, count } = await query

  if (error) {
    console.error("Error fetching applications:", error)
  }

  // Fetch openings for the filter dropdown
  const { data: openingsData } = await supabase
    .from('openings')
    .select('id, title')
    .eq('company_id', activeCompanyId || '')
    .order('title');

  return (
    <ApplicantsListClient 
      applications={applications as any || []} 
      totalCount={count || 0}
      openings={openingsData || []}
      activeCompanyId={activeCompanyId}
    />
  )
}
