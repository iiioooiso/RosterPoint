'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns'
import { getGlobalHistory, ApplicationHistoryEvent } from '@/app/actions/history'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import {
  FileText,
  UserPlus,
  UserMinus,
  MessageSquare,
  ArrowRightCircle,
  XCircle,
  RotateCcw
} from 'lucide-react'

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
}

function formatRelativeGroup(dateStr: string) {
  const date = new Date(dateStr)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMMM d, yyyy')
}

export function HistoryTimelineView({ 
  events, 
  compact = false,
  emptyMessage = "No recent activity found."
}: { 
  events: ApplicationHistoryEvent[]
  compact?: boolean
  emptyMessage?: string
}) {
  // Group events by relative date
  const groupedEvents = events.reduce((groups, event) => {
    const groupName = formatRelativeGroup(event.created_at)
    if (!groups[groupName]) {
      groups[groupName] = []
    }
    groups[groupName].push(event)
    return groups
  }, {} as Record<string, ApplicationHistoryEvent[]>)

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedEvents).map(([groupName, groupEvents]) => (
        <div key={groupName} className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">{groupName}</h3>
          <div className={cn(
            "space-y-4 relative",
            compact 
              ? "before:absolute before:inset-0 before:left-[18px] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent"
              : "before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent"
          )}>
            {groupEvents.map(event => (
              <HistoryItem key={event.id} event={event} compact={compact} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function HistoryFeed({ initialData, initialCount }: { initialData: ApplicationHistoryEvent[], initialCount: number }) {
  const [events, setEvents] = useState<ApplicationHistoryEvent[]>(initialData)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const hasMore = events.length < initialCount

  const loadMore = async () => {
    setIsLoading(true)
    const nextPage = page + 1
    const { data } = await getGlobalHistory(nextPage, 50)
    setEvents(prev => [...prev, ...data])
    setPage(nextPage)
    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      <HistoryTimelineView events={events} compact={false} />

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" size="sm" onClick={loadMore} disabled={isLoading}>
            {isLoading ? "Loading..." : "Load More Activity"}
          </Button>
        </div>
      )}
    </div>
  )
}

export function HistoryItem({ event, compact = false }: { event: ApplicationHistoryEvent, compact?: boolean }) {
  let icon = <FileText className="w-4 h-4 text-slate-500" />
  let bgClass = "bg-slate-100 dark:bg-slate-800"
  let description = "Activity recorded"

  const candidateName = event.application?.candidate_name || 'Unknown Candidate'
  const roleTitle = event.application?.opening?.title || 'Unknown Role'
  const actorName = event.actor?.name || 'System'

  switch (event.event_type) {
    case 'application_created':
      icon = <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      bgClass = "bg-blue-100 border-blue-200 dark:bg-blue-950/60 dark:border-blue-900"
      description = `Application submitted`
      break
    case 'stage_changed':
      icon = <ArrowRightCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
      bgClass = "bg-amber-100 border-amber-200 dark:bg-amber-950/60 dark:border-amber-900"
      description = `Moved from ${event.details?.old_stage || 'unknown'} to ${event.details?.new_stage || 'unknown'}`
      break
    case 'application_rejected':
      icon = <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
      bgClass = "bg-red-100 border-red-200 dark:bg-red-950/60 dark:border-red-900"
      description = `Rejected from ${event.details?.from_stage || 'unknown'}`
      break
    case 'application_reinstated':
      icon = <RotateCcw className="w-4 h-4 text-green-600 dark:text-green-400" />
      bgClass = "bg-green-100 border-green-200 dark:bg-green-950/60 dark:border-green-900"
      description = `Reinstated to ${event.details?.to_stage || 'unknown'}`
      break
    case 'interviewer_assigned':
      icon = <UserPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
      bgClass = "bg-indigo-100 border-indigo-200 dark:bg-indigo-950/60 dark:border-indigo-900"
      description = `Assigned as interviewer`
      break
    case 'interviewer_removed':
      icon = <UserMinus className="w-4 h-4 text-slate-600 dark:text-slate-400" />
      bgClass = "bg-slate-100 border-slate-200 dark:bg-slate-900 dark:border-slate-800"
      description = `Removed from interview panel`
      break
    case 'feedback_added':
      icon = <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
      bgClass = "bg-purple-100 border-purple-200 dark:bg-purple-950/60 dark:border-purple-900"
      description = `Interview feedback added`
      break
  }

  if (compact) {
    return (
      <div className="relative flex items-start gap-3 group">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full border border-border/50 bg-background shadow-sm shrink-0 z-10 ${bgClass}`}>
          {icon}
        </div>
        <div className="flex-1 p-3 rounded-lg border border-border/50 bg-muted/20 shadow-sm hover:border-border/80 transition-colors">
          <div className="flex items-start justify-between gap-3 mb-2">
            <span className="text-sm font-medium text-foreground leading-tight">
              {description}
            </span>
            <time className="text-[11px] text-muted-foreground shrink-0 whitespace-nowrap mt-0.5">
              {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
            </time>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{format(new Date(event.created_at), 'MMM d, yyyy · h:mm a')}</span>
            <div className="flex items-center gap-1.5">
              <span>by {actorName}</span>
              <Avatar className="h-4 w-4 border border-border/50">
                <AvatarFallback className="text-[8px] bg-muted text-foreground font-medium">{getInitials(actorName)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
      <div className={`flex items-center justify-center w-10 h-10 rounded-full border border-border bg-card shadow-xs shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${bgClass}`}>
        {icon}
      </div>
      
      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border border-border bg-card shadow-xs hover:border-muted-foreground/30 transition-colors">
        <Link href={`/recruiter/applicants/${event.application_id}`} className="block">
          <div className="flex items-center justify-between space-x-2 mb-2">
            <div className="font-semibold text-foreground text-sm hover:underline">
              {candidateName}
            </div>
            <time className="text-xs text-muted-foreground font-medium">
              {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
            </time>
          </div>
          <div className="text-xs text-muted-foreground mb-3">
            {roleTitle}
          </div>
          
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
            <div className="text-sm text-foreground/90 capitalize">
              {description}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>by {actorName}</span>
              <Avatar className="h-5 w-5 border border-border">
                <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">{getInitials(actorName)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
