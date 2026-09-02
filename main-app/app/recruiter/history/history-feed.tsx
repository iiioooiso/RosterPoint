'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns'
import { getGlobalHistory, ApplicationHistoryEvent } from '@/app/actions/history'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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

  // Group events by relative date
  const groupedEvents = events.reduce((groups, event) => {
    const groupName = formatRelativeGroup(event.created_at)
    if (!groups[groupName]) {
      groups[groupName] = []
    }
    groups[groupName].push(event)
    return groups
  }, {} as Record<string, ApplicationHistoryEvent[]>)

  return (
    <div className="space-y-8">
      {Object.entries(groupedEvents).map(([groupName, groupEvents]) => (
        <div key={groupName} className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">{groupName}</h3>
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
            {groupEvents.map(event => (
              <HistoryItem key={event.id} event={event} />
            ))}
          </div>
        </div>
      ))}

      {events.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No recent activity found.
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-6">
          <Button variant="outline" onClick={loadMore} disabled={isLoading}>
            {isLoading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  )
}

function HistoryItem({ event }: { event: ApplicationHistoryEvent }) {
  let icon = <FileText className="w-4 h-4 text-slate-500" />
  let bgClass = "bg-slate-100"
  let description = "Activity recorded"

  const candidateName = event.application?.candidate_name || 'Unknown Candidate'
  const roleTitle = event.application?.opening?.title || 'Unknown Role'
  const actorName = event.actor?.name || 'System'

  switch (event.event_type) {
    case 'application_created':
      icon = <FileText className="w-4 h-4 text-blue-600" />
      bgClass = "bg-blue-100 border-blue-200"
      description = `Application submitted`
      break
    case 'stage_changed':
      icon = <ArrowRightCircle className="w-4 h-4 text-amber-600" />
      bgClass = "bg-amber-100 border-amber-200"
      description = `Moved from ${event.details?.old_stage || 'unknown'} to ${event.details?.new_stage || 'unknown'}`
      break
    case 'application_rejected':
      icon = <XCircle className="w-4 h-4 text-red-600" />
      bgClass = "bg-red-100 border-red-200"
      description = `Rejected from ${event.details?.from_stage || 'unknown'}`
      break
    case 'application_reinstated':
      icon = <RotateCcw className="w-4 h-4 text-green-600" />
      bgClass = "bg-green-100 border-green-200"
      description = `Reinstated to ${event.details?.to_stage || 'unknown'}`
      break
    case 'interviewer_assigned':
      icon = <UserPlus className="w-4 h-4 text-indigo-600" />
      bgClass = "bg-indigo-100 border-indigo-200"
      description = `Assigned as interviewer`
      break
    case 'interviewer_removed':
      icon = <UserMinus className="w-4 h-4 text-slate-600" />
      bgClass = "bg-slate-100 border-slate-200"
      description = `Removed from interview panel`
      break
    case 'feedback_added':
      icon = <MessageSquare className="w-4 h-4 text-purple-600" />
      bgClass = "bg-purple-100 border-purple-200"
      description = `Interview feedback added`
      break
  }

  return (
    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
      <div className={`flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${bgClass}`}>
        {icon}
      </div>
      
      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 bg-white shadow-sm hover:border-slate-300 transition-colors">
        <Link href={`/recruiter/applicants/${event.application_id}`} className="block">
          <div className="flex items-center justify-between space-x-2 mb-2">
            <div className="font-semibold text-slate-900 text-sm hover:underline">
              {candidateName}
            </div>
            <time className="text-xs text-muted-foreground font-medium">
              {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
            </time>
          </div>
          <div className="text-xs text-slate-500 mb-3">
            {roleTitle}
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="text-sm text-slate-700 capitalize">
              {description}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>by {actorName}</span>
              <Avatar className="h-5 w-5 border border-slate-200">
                <AvatarFallback className="text-[9px] bg-slate-100 text-slate-600">{getInitials(actorName)}</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
