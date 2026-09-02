'use client'

import { AssignmentsTable } from '@/components/interview-panel/assignments-table'
import { getAssignmentsData } from '@/app/actions/interview-panel-data'
import { useCachedAction } from '@/hooks/use-cached-action'
import { Loader2 } from 'lucide-react'

export function AssignmentsView({ 
  searchParams 
}: { 
  searchParams: { [key: string]: string | string[] | undefined } 
}) {
  const cacheKey = JSON.stringify(['assignments', searchParams])
  const { data, isLoading, error } = useCachedAction(cacheKey, () => getAssignmentsData(searchParams))

  if (isLoading && !data) {
    return <div className="p-8 text-center text-muted-foreground">Loading assignments...</div>
  }

  if (error) {
    return <div className="p-4 border rounded-md text-destructive bg-destructive/10">Failed to load assignments.</div>
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-4">
      <AssignmentsTable 
        applications={data.applications} 
        totalCount={data.count}
        currentPage={data.page}
        pageSize={data.pageSize}
        allInterviewers={data.allInterviewers}
        departments={data.departments}
        openings={data.openings}
        currentFilters={{ 
          query: data.query, 
          department: data.department, 
          opening: data.opening, 
          interviewer: data.interviewer, 
          sort: data.sort 
        }}
      />
    </div>
  )
}
