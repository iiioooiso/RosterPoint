'use client'

import { useEffect, useState, useTransition } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { getApplicationDetails, removeInterviewerFromApplication } from '@/app/actions/interview-panel'
import { Loader2, Calendar, User, Briefcase, History, Plus, X } from 'lucide-react'
import { format } from 'date-fns'
import { AddInterviewerDialog } from './add-interviewer-dialog'
import { toast } from 'sonner'

export function ApplicationDetailsSheet({ 
  applicationId, 
  onOpenChange,
  allInterviewers
}: { 
  applicationId: string | null; 
  onOpenChange: (open: boolean) => void;
  allInterviewers: any[];
}) {
  const [data, setData] = useState<{ application: any; panel: any[]; history: any[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const loadData = async (id: string) => {
    setLoading(true)
    const res = await getApplicationDetails(id)
    if (res.error) {
      toast.error(res.error)
      onOpenChange(false)
    } else {
      setData(res as any)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (applicationId) {
      loadData(applicationId)
    } else {
      setData(null)
    }
  }, [applicationId])

  const handleRemoveInterviewer = async (interviewerId: string) => {
    if (!applicationId) return
    startTransition(async () => {
      const res = await removeInterviewerFromApplication(applicationId, interviewerId)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Interviewer removed.')
        // Reload data to reflect change
        loadData(applicationId)
      }
    })
  }

  if (!applicationId) return null

  const { application, panel, history } = data || {}

  return (
    <>
      <Sheet open={!!applicationId} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-md w-full overflow-y-auto">
          {loading || !application ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              Loading details...
            </div>
          ) : (
            <div className="space-y-8 py-4">
              {/* Header Info */}
              <SheetHeader className="text-left space-y-1">
                <SheetTitle className="text-2xl">{application.candidate_name || 'Unknown Candidate'}</SheetTitle>
                <SheetDescription className="flex flex-col gap-1.5 mt-2">
                  <span className="flex items-center gap-2 text-foreground">
                    <Briefcase className="w-4 h-4" />
                    {application.opening?.title} <span className="text-muted-foreground">({application.opening?.department})</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {application.candidate_email}
                  </span>
                </SheetDescription>
              </SheetHeader>

              <Separator />

              {/* Panel Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Interview Panel</h3>
                  <Button variant="ghost" size="sm" onClick={() => setAddDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </div>
                
                {panel && panel.length > 0 ? (
                  <div className="space-y-2">
                    {panel.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded-md bg-muted/40 border">
                        <div className="text-sm font-medium">{p.interviewer?.name || 'Unknown'}</div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveInterviewer(p.interviewer.id)}
                          disabled={isPending}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded-md bg-muted/10">
                    No interviewers assigned yet.
                  </div>
                )}
              </div>

              <Separator />

              {/* Application details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Application</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground mb-1">Current Stage</div>
                    <Badge variant="secondary" className="uppercase">{application.stage}</Badge>
                  </div>
                  <div>
                    <div className="text-muted-foreground mb-1">Applied</div>
                    <div className="font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      {format(new Date(application.created_at), 'MMM d, yyyy')}
                    </div>
                  </div>
                  {application.source && (
                    <div>
                      <div className="text-muted-foreground mb-1">Source</div>
                      <div className="font-medium">{application.source}</div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* History / Activity */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <History className="w-4 h-4" /> Activity
                </h3>
                
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent">
                  {history && history.length > 0 ? (
                    history.map((h: any) => (
                      <div key={h.id} className="relative flex items-start gap-4">
                        <div className="absolute left-0 mt-1 w-4 h-4 rounded-full bg-background border-2 border-primary ml-0 z-10" />
                        <div className="ml-8 text-sm space-y-1">
                          <div className="font-medium text-foreground">
                            {h.event_type === 'interviewer_assigned' && (
                              <span>Assigned <span className="font-semibold text-primary">{h.details?.interviewer_id}</span> to panel</span>
                            )}
                            {h.event_type === 'interviewer_removed' && (
                              <span>Removed <span className="font-semibold text-destructive">{h.details?.interviewer_id}</span> from panel</span>
                            )}
                            {/* Will display actual names if added to details, for now ID or if mapped correctly. 
                                Realistically, we'd want interviewer name. Let's just say "Assigned interviewer". */}
                            {h.event_type !== 'interviewer_assigned' && h.event_type !== 'interviewer_removed' && (
                              <span>{h.event_type}</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(h.created_at), 'MMM d, yyyy h:mm a')} • by {h.actor?.name || 'System'}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground pl-8 italic">No assignment history.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AddInterviewerDialog 
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        applicationIds={[applicationId]}
        allInterviewers={allInterviewers}
        onSuccess={() => {
          setAddDialogOpen(false)
          loadData(applicationId)
        }}
      />
    </>
  )
}
