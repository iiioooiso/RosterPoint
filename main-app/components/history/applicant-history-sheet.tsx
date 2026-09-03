'use client'

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { HistoryTimelineView } from '@/app/recruiter/history/history-feed'
import { ApplicantHistorySummary } from '@/app/actions/history'
import { ExternalLink, Calendar, History, Briefcase, Mail } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

const STAGE_COLORS: Record<string, string> = {
  applied: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
  screening: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
  interview: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900',
  offer: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
  hired: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
}

export function ApplicantHistorySheet({
  applicant,
  open,
  onOpenChange
}: {
  applicant: ApplicantHistorySummary | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!applicant) return null

  const stageClass = STAGE_COLORS[applicant.stage] || 'bg-muted text-muted-foreground border-border'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl lg:max-w-3xl overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden p-8 gap-6 space-y-6">
        <SheetHeader className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SheetTitle className="text-xl font-bold tracking-tight">
                {applicant.candidate_name}
              </SheetTitle>
              <SheetDescription className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Mail className="w-3 h-3" />
                {applicant.candidate_email}
              </SheetDescription>
            </div>
            <Badge variant="outline" className={`capitalize shrink-0 text-xs px-2 py-0.5 font-medium ${stageClass}`}>
              {applicant.stage}
            </Badge>
          </div>
        </SheetHeader>

        {/* Candidate Context Summary */}
        <div className="grid grid-cols-2 gap-3 p-3.5 bg-muted/40 rounded-lg border border-border/60 text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px] font-medium">Opening / Role</span>
            <div className="font-medium text-foreground flex items-center gap-1.5 mt-0.5">
              <Briefcase className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{applicant.opening_title}</span>
            </div>
            <span className="text-[11px] text-muted-foreground block mt-0.5">{applicant.opening_department}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[11px] font-medium">Activity Summary</span>
            <div className="font-medium text-foreground flex items-center gap-1.5 mt-0.5">
              <History className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span>{applicant.history_count} total events</span>
            </div>
            <span className="text-[11px] text-muted-foreground block mt-0.5">
              Applied {format(new Date(applicant.created_at), 'MMM d, yyyy')}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" />
            Audit Trail & Activity
          </h4>
          <Link href={`/recruiter/applicants/${applicant.id}`} className="text-xs text-primary hover:underline flex items-center gap-1">
            View Application
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <Separator />

        {/* Timeline Component */}
        <div className="pb-6">
          <HistoryTimelineView 
            events={applicant.history} 
            compact={true} 
            emptyMessage="No history events recorded for this candidate yet."
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
