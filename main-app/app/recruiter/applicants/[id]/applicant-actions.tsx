'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { updateApplicationStage, generateDocumentSignedUrl } from "@/app/actions/applications"
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

export function ApplicantActions({ applicationId, currentStage }: { applicationId: string, currentStage: string }) {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStageChange = async (newStage: string | null) => {
    if (!newStage) return
    setIsUpdating(true)
    await updateApplicationStage(applicationId, newStage)
    setIsUpdating(false)
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground">Current Stage:</span>
      <Select defaultValue={currentStage} onValueChange={handleStageChange} disabled={isUpdating}>
        <SelectTrigger className="w-[160px] capitalize">
          <SelectValue placeholder="Select stage" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="applied">Applied</SelectItem>
          <SelectItem value="screening">Screening</SelectItem>
          <SelectItem value="interview">Interview</SelectItem>
          <SelectItem value="offer">Offer</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="withdrawn">Withdrawn</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export function DownloadDocument({ storagePath }: { storagePath: string }) {
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
        alert("Failed to access document.")
        setIsOpen(false)
      }
      setIsGenerating(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger render={<Button variant="secondary" size="sm" />}>
        View Document
      </SheetTrigger>
      <SheetContent className="!w-[90vw] sm:!max-w-4xl sm:!w-[80vw] p-0 flex flex-col h-full">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Document Viewer</SheetTitle>
        </SheetHeader>
        <div className="flex-1 bg-muted relative w-full h-full">
          {isGenerating ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-muted-foreground animate-pulse">Loading document securely...</span>
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
  const [saved, setSaved] = useState(false)

  // Wait, I need an action to update notes. I can add it to actions/applications.ts
  const handleSave = async () => {
    setIsSaving(true)

    // Quick hack for this implementation instead of a new server action:
    // we can use a server action if we create one, or just call supabase from client if RLS allows.
    // Let's assume we create a server action updateApplicationNotes(applicationId, notes)
    // To save time, we will rely on a new server action imported dynamically or use fetch.
    const { updateApplicationNotes } = await import('@/app/actions/applications-notes')
    const result = await updateApplicationNotes(applicationId, notes)

    if (result?.success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }

    setIsSaving(false)
  }

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="Add your thoughts and evaluation notes here..."
        className="min-h-[150px] resize-none"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : saved ? "Saved!" : "Save Notes"}
        </Button>
      </div>
    </div>
  )
}
