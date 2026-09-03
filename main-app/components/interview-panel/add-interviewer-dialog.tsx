'use client'

import { useState, useTransition, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { addInterviewerToApplication, bulkAddInterviewer } from '@/app/actions/interview-panel'
import { getInterviewersData } from '@/app/actions/interview-panel-data'
import { toast } from 'sonner'
import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AddInterviewerDialog({ 
  open, 
  onOpenChange, 
  applicationIds, 
  allInterviewers,
  onSuccess
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  applicationIds: string[];
  allInterviewers: any[];
  onSuccess?: () => void;
}) {
  const [selectedInterviewerId, setSelectedInterviewerId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [interviewersList, setInterviewersList] = useState<any[]>(allInterviewers || [])
  const [isLoadingInterviewers, setIsLoadingInterviewers] = useState(false)

  useEffect(() => {
    if (allInterviewers && allInterviewers.length > 0) {
      setInterviewersList(allInterviewers)
    } else if (open) {
      setIsLoadingInterviewers(true)
      getInterviewersData()
        .then(res => {
          if (res?.interviewers) {
            setInterviewersList(res.interviewers)
          }
        })
        .catch(err => {
          console.error("Error loading interviewers for dialog:", err)
        })
        .finally(() => setIsLoadingInterviewers(false))
    }
  }, [open, allInterviewers])

  const handleAdd = () => {
    if (!selectedInterviewerId) return

    startTransition(async () => {
      if (applicationIds.length === 1) {
        const res = await addInterviewerToApplication(applicationIds[0], selectedInterviewerId)
        if (res?.error) {
          toast.error(res.error)
        } else {
          toast.success('Interviewer assigned successfully.')
          onSuccess?.()
          onOpenChange(false)
        }
      } else if (applicationIds.length > 1) {
        const res = await bulkAddInterviewer(applicationIds, selectedInterviewerId)
        if (res?.success) {
          toast.success(`Assigned interviewer to ${res.results?.successCount} application(s).`)
          if (res.results && res.results.failures.length > 0) {
            toast.error(`Failed on ${res.results.failures.length} application(s).`)
          }
          onSuccess?.()
          onOpenChange(false)
        }
      }
    })
  }

  // Reset state when opening
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setSelectedInterviewerId(null)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Interviewer</DialogTitle>
          <DialogDescription>
            Assign an interviewer to the selected {applicationIds.length === 1 ? 'application' : `${applicationIds.length} applications`}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="border rounded-md">
            <Command>
              <CommandInput placeholder="Search interviewer..." />
              <CommandList className="max-h-[200px]">
                {isLoadingInterviewers ? (
                  <div className="flex items-center justify-center p-4 text-xs text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                    Loading interviewers...
                  </div>
                ) : (
                  <>
                    <CommandEmpty>No interviewers found.</CommandEmpty>
                    <CommandGroup>
                      {interviewersList.map((interviewer) => (
                        <CommandItem
                          key={interviewer.id}
                          value={`${interviewer.name || interviewer.id} ${interviewer.scopeLabel || ''}`}
                          onSelect={() => setSelectedInterviewerId(interviewer.id)}
                          className="cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedInterviewerId === interviewer.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span>{interviewer.name || 'Unknown'}</span>
                          </div>
                          <span className="text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-muted font-normal ml-2">
                            {interviewer.scopeLabel || 'Company-Wide'}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!selectedInterviewerId || isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {applicationIds.length > 1 ? 'Add to Selected' : 'Add Interviewer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
