'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Briefcase, Loader2 } from 'lucide-react'
import { getInterviewersData } from '@/app/actions/interview-panel-data'
import { useCachedAction } from '@/hooks/use-cached-action'

export function InterviewersView() {
  const { data, isLoading, error } = useCachedAction('interviewers', getInterviewersData)

  if (isLoading && !data) {
    return <div className="p-8 text-center text-muted-foreground">Loading interviewers...</div>
  }

  if (error) {
    return <div className="p-4 border rounded-md text-destructive bg-destructive/10">Failed to load interviewers.</div>
  }

  if (!data) {
    return null
  }

  const { interviewers } = data

  if (interviewers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-lg bg-muted/10">
        <Users className="w-10 h-10 mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium">No interviewers found</h3>
        <p className="mt-1 text-sm text-muted-foreground mb-6">
          You don't have any interviewers in your workspace yet.
        </p>
        <Button render={<a href="/recruiter/teams?tab=invitations" />}>
          Invite Interviewer
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {interviewers.map((interviewer: any) => {
        const assignments = interviewer.application_interviewers || []
        const activeCount = assignments.length
        
        return (
          <Card key={interviewer.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex justify-between items-start">
                <span className="truncate">{interviewer.name || 'Unnamed Interviewer'}</span>
                <Badge variant={activeCount > 0 ? 'default' : 'secondary'}>
                  {activeCount} active
                </Badge>
              </CardTitle>
              <CardDescription>
                Workload Overview
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {activeCount === 0 ? (
                <div className="flex-1 flex items-center justify-center py-6 text-sm text-muted-foreground text-center">
                  No active assignments
                </div>
              ) : (
                <div className="space-y-4 flex-1">
                  <div className="space-y-3">
                    {assignments.slice(0, 3).map((assignment: any) => {
                      const app = assignment.application
                      return (
                        <div key={app.id} className="text-sm flex items-start justify-between group">
                          <div className="flex flex-col truncate pr-2">
                            <span className="font-medium truncate">{app.candidate_name || 'Unknown'}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                              <Briefcase className="w-3 h-3" />
                              {app.opening?.title || 'Unknown Role'}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[10px] uppercase px-1.5 py-0 h-5 mt-0.5 whitespace-nowrap">
                            {app.stage}
                          </Badge>
                        </div>
                      )
                    })}
                    {activeCount > 3 && (
                      <div className="text-xs text-muted-foreground pt-1">
                        + {activeCount - 3} more applications
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="w-full" 
                  disabled={activeCount === 0}
                  render={<a href={`/recruiter/interview-panel?interviewer=${interviewer.id}`} />}
                >
                  View Assignments
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
