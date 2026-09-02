'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { updateApplicationStage, generateDocumentSignedUrl } from "@/app/actions/applications"
import { updateApplicationNotes } from "@/app/actions/applications-notes"
import { addInterviewerToApplication, removeInterviewerFromApplication } from "@/app/actions/interview-panel"
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  UserPlus, 
  Trash2, 
  FileText, 
  ExternalLink,
  Loader2 
} from 'lucide-react'
import { ApplicationStage } from '@/lib/types'

const STAGE_ORDER: ApplicationStage[] = ['applied', 'screening', 'interview', 'offer', 'hired']

const STAGE_LABELS: Record<string, string> = {
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected'
}

export function ApplicantActions({ 
  applicationId, 
  currentStage 
}: { 
  applicationId: string, 
  currentStage: string 
}) {
  const [isUpdating, setIsUpdating] = useState(false)

  const currentIdx = STAGE_ORDER.indexOf(currentStage as ApplicationStage)
  const nextStage = currentIdx >= 0 && currentIdx < STAGE_ORDER.length - 1 ? STAGE_ORDER[currentIdx + 1] : null

  const handleStageChange = async (newStage: string) => {
    if (!newStage || newStage === currentStage) return
    setIsUpdating(true)
    const res = await updateApplicationStage(applicationId, newStage)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success(`Application moved to ${STAGE_LABELS[newStage] || newStage}`)
    }
    setIsUpdating(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Quick Advance Button */}
      {nextStage && currentStage !== 'rejected' && (
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => handleStageChange(nextStage)}
          disabled={isUpdating}
          className="gap-1.5"
        >
          {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {nextStage === 'hired' ? 'Hire Candidate' : `Advance to ${STAGE_LABELS[nextStage]}`}
        </Button>
      )}

      {/* Reject Button (if active) */}
      {currentStage !== 'rejected' && currentStage !== 'hired' && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleStageChange('rejected')}
          disabled={isUpdating}
          className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
        >
          <XCircle className="h-4 w-4" />
          Reject
        </Button>
      )}

      {/* Reinstate Button (if rejected) */}
      {currentStage === 'rejected' && (
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => handleStageChange('applied')} // Server will enforce / validate exact from_stage
          disabled={isUpdating}
          className="gap-1.5"
        >
          <RotateCcw className="h-4 w-4" />
          Reinstate Application
        </Button>
      )}

      {/* Stage Dropdown */}
      <div className="flex items-center gap-2">
        <Select 
          value={currentStage} 
          onValueChange={(val) => val && handleStageChange(val)} 
          disabled={isUpdating}
        >
          <SelectTrigger className="w-[145px] h-9 capitalize text-xs">
            <SelectValue placeholder="Select stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="applied">Applied</SelectItem>
            <SelectItem value="screening">Screening</SelectItem>
            <SelectItem value="interview">Interview</SelectItem>
            <SelectItem value="offer">Offer</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export function DownloadDocument({ storagePath, filename }: { storagePath: string, filename?: string }) {
  const [docUrl, setDocUrl] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open)
    if (open && !docUrl) {
      setIsGenerating(true)
      const result = await generateDocumentSignedUrl(storagePath)
      if (result.url) {
        setDocUrl(result.url)
      } else {
        toast.error("Failed to generate document access URL.")
        setIsOpen(false)
      }
      setIsGenerating(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger render={<Button variant="outline" size="sm" className="gap-1.5 text-xs" />}>
        <FileText className="h-3.5 w-3.5" />
        View Document
      </SheetTrigger>
      <SheetContent className="!w-[90vw] sm:!max-w-4xl sm:!w-[80vw] p-0 flex flex-col h-full">
        <SheetHeader className="p-4 border-b flex flex-row items-center justify-between">
          <SheetTitle className="text-base font-medium">{filename || "Document Viewer"}</SheetTitle>
          {docUrl && (
            <a 
              href={docUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-primary flex items-center gap-1 hover:underline mr-8"
            >
              Open in new tab <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </SheetHeader>
        <div className="flex-1 bg-muted/40 relative w-full h-full">
          {isGenerating ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-muted-foreground animate-pulse text-sm">Loading document securely...</span>
            </div>
          ) : docUrl ? (
            <iframe src={docUrl} className="w-full h-full border-0" title="Document Viewer" />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function NotesForm({ applicationId, initialNotes }: { applicationId: string, initialNotes: string }) {
  const [notes, setNotes] = useState(initialNotes)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    const result = await updateApplicationNotes(applicationId, notes)

    if (result?.success) {
      toast.success("Internal notes saved.")
    } else {
      toast.error(result?.error || "Failed to save notes.")
    }

    setIsSaving(false)
  }

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="Add confidential evaluation notes, interviewer impressions, or hiring considerations..."
        className="min-h-[140px] resize-none text-sm"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="sm">
          {isSaving ? "Saving..." : "Save Notes"}
        </Button>
      </div>
    </div>
  )
}

export function InterviewPanelManager({ 
  applicationId, 
  assignedInterviewers, 
  availableInterviewers 
}: { 
  applicationId: string, 
  assignedInterviewers: any[], 
  availableInterviewers: any[] 
}) {
  const [isPending, setIsPending] = useState(false)
  const [selectedInterviewerId, setSelectedInterviewerId] = useState<string>('')

  const assignedIds = new Set(assignedInterviewers.map(a => a.interviewer_id))
  const unassigned = availableInterviewers.filter(i => !assignedIds.has(i.id))

  const handleAssign = async () => {
    if (!selectedInterviewerId) return
    setIsPending(true)
    const res = await addInterviewerToApplication(applicationId, selectedInterviewerId)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success("Interviewer assigned successfully.")
      setSelectedInterviewerId('')
    }
    setIsPending(false)
  }

  const handleRemove = async (interviewerId: string) => {
    setIsPending(true)
    const res = await removeInterviewerFromApplication(applicationId, interviewerId)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success("Interviewer removed from application.")
    }
    setIsPending(false)
  }

  return (
    <div className="space-y-4">
      {/* List of assigned interviewers */}
      {assignedInterviewers.length > 0 ? (
        <div className="space-y-2">
          {assignedInterviewers.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-2.5 rounded-md border bg-muted/20 text-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-medium text-xs flex items-center justify-center shrink-0">
                  {(item.interviewer?.name || 'I').substring(0, 2).toUpperCase()}
                </div>
                <div className="truncate">
                  <p className="font-medium text-foreground truncate">{item.interviewer?.name || 'Interviewer'}</p>
                  {item.interviewer?.job_title && (
                    <p className="text-xs text-muted-foreground truncate">{item.interviewer.job_title}</p>
                  )}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleRemove(item.interviewer_id)}
                disabled={isPending}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No interviewers assigned to this candidate yet.</p>
      )}

      {/* Assign new interviewer form */}
      {unassigned.length > 0 && (
        <div className="flex items-center gap-2 pt-1 border-t">
          <Select 
            value={selectedInterviewerId} 
            onValueChange={(val) => setSelectedInterviewerId(val || '')} 
            disabled={isPending}
          >
            <SelectTrigger className="flex-1 h-8 text-xs">
              <SelectValue placeholder="Assign an interviewer..." />
            </SelectTrigger>
            <SelectContent>
              {unassigned.map((interviewer) => (
                <SelectItem key={interviewer.id} value={interviewer.id} className="text-xs">
                  {interviewer.name || 'Unnamed Interviewer'} {interviewer.job_title ? `(${interviewer.job_title})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            size="sm" 
            variant="secondary"
            onClick={handleAssign} 
            disabled={!selectedInterviewerId || isPending}
            className="h-8 gap-1 text-xs"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Assign
          </Button>
        </div>
      )}
    </div>
  )
}
