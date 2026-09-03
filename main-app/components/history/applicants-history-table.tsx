'use client'

import { useState, useMemo } from 'react'
import { ApplicantHistorySummary } from '@/app/actions/history'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ApplicantHistorySheet } from './applicant-history-sheet'
import { 
  Search, 
  History, 
  Clock, 
  ExternalLink, 
  ArrowUpDown,
  Filter,
  Users
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

const STAGE_COLORS: Record<string, string> = {
  applied: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
  screening: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
  interview: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900',
  offer: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
  hired: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
}

const STAGE_LABELS: Record<string, string> = {
  all: 'All Stages',
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected'
}

export function ApplicantsHistoryTable({ applicants }: { applicants: ApplicantHistorySummary[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantHistorySummary | null>(null)

  // Extract distinct departments (filtering out any raw UUIDs)
  const departments = useMemo(() => {
    const set = new Set<string>()
    applicants.forEach(a => {
      const d = a.opening_department
      if (d && !/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(d)) {
        set.add(d)
      }
    })
    return Array.from(set).sort()
  }, [applicants])

  // Filtered applicants
  const filteredApplicants = useMemo(() => {
    return applicants.filter(app => {
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch = !q || 
        app.candidate_name.toLowerCase().includes(q) ||
        app.candidate_email.toLowerCase().includes(q) ||
        app.opening_title.toLowerCase().includes(q) ||
        app.opening_department.toLowerCase().includes(q)

      const matchesStage = stageFilter === 'all' || app.stage === stageFilter
      const matchesDept = departmentFilter === 'all' || app.opening_department === departmentFilter

      return matchesSearch && matchesStage && matchesDept
    })
  }, [applicants, searchQuery, stageFilter, departmentFilter])

  return (
    <div className="space-y-4">
      {/* Toolbar / Filters */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applicants or roles..."
            className="pl-9 h-9 bg-background text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Select value={stageFilter} onValueChange={(val) => setStageFilter(val || 'all')}>
            <SelectTrigger className="w-[150px] h-9 bg-background text-xs">
              <SelectValue placeholder="All Stages">
                {STAGE_LABELS[stageFilter] || 'All Stages'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="screening">Screening</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="offer">Offer</SelectItem>
              <SelectItem value="hired">Hired</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          {departments.length > 0 && (
            <Select value={departmentFilter} onValueChange={(val) => setDepartmentFilter(val || 'all')}>
              <SelectTrigger className="w-[160px] h-9 bg-background text-xs">
                <SelectValue placeholder="All Departments">
                  {departmentFilter === 'all' ? 'All Departments' : departmentFilter}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {(searchQuery || stageFilter !== 'all' || departmentFilter !== 'all') && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 text-xs text-muted-foreground"
              onClick={() => {
                setSearchQuery('')
                setStageFilter('all')
                setDepartmentFilter('all')
              }}
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Row-based Applicants Table */}
      <div className="rounded-lg border bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 text-xs">
              <TableHead className="font-semibold text-foreground">Applicant</TableHead>
              <TableHead className="font-semibold text-foreground">Role & Department</TableHead>
              <TableHead className="font-semibold text-foreground">Stage</TableHead>
              <TableHead className="font-semibold text-foreground">Latest Activity</TableHead>
              <TableHead className="font-semibold text-foreground">Events</TableHead>
              <TableHead className="text-right font-semibold text-foreground pr-4">History</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplicants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground text-sm">
                  {applicants.length === 0 
                    ? "No applicants found in the pipeline yet."
                    : "No applicants match your current filters."
                  }
                </TableCell>
              </TableRow>
            ) : (
              filteredApplicants.map((app) => {
                const stageStyle = STAGE_COLORS[app.stage] || 'bg-muted text-muted-foreground'
                const latestEvt = app.latest_event

                let latestActionLabel = "Applied"
                if (latestEvt) {
                  if (latestEvt.event_type === 'application_created') latestActionLabel = "Application submitted"
                  else if (latestEvt.event_type === 'stage_changed') latestActionLabel = `Moved to ${latestEvt.details?.new_stage || 'stage'}`
                  else if (latestEvt.event_type === 'application_rejected') latestActionLabel = "Rejected"
                  else if (latestEvt.event_type === 'application_reinstated') latestActionLabel = "Reinstated"
                  else if (latestEvt.event_type === 'interviewer_assigned') latestActionLabel = "Interviewer assigned"
                  else if (latestEvt.event_type === 'interviewer_removed') latestActionLabel = "Interviewer removed"
                  else if (latestEvt.event_type === 'feedback_added') latestActionLabel = "Feedback submitted"
                  else latestActionLabel = latestEvt.event_type.replace(/_/g, ' ')
                }

                return (
                  <TableRow key={app.id} className="hover:bg-muted/30 transition-colors">
                    {/* Candidate */}
                    <TableCell className="py-3">
                      <div>
                        <button
                          onClick={() => setSelectedApplicant(app)}
                          className="font-medium text-foreground hover:text-primary transition-colors text-left block text-sm"
                        >
                          {app.candidate_name}
                        </button>
                        <span className="text-xs text-muted-foreground font-normal block">
                          {app.candidate_email}
                        </span>
                      </div>
                    </TableCell>

                    {/* Role & Dept */}
                    <TableCell className="py-3">
                      <div className="text-sm font-normal text-foreground">
                        {app.opening_title}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {app.opening_department}
                      </span>
                    </TableCell>

                    {/* Stage */}
                    <TableCell className="py-3">
                      <Badge variant="outline" className={`capitalize font-normal text-xs px-2 py-0.5 ${stageStyle}`}>
                        {app.stage}
                      </Badge>
                    </TableCell>

                    {/* Latest Activity */}
                    <TableCell className="py-3 max-w-[240px]">
                      {latestEvt ? (
                        <div>
                          <div className="text-xs font-medium text-foreground/90 truncate">
                            {latestActionLabel}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>{formatDistanceToNow(new Date(latestEvt.created_at), { addSuffix: true })}</span>
                            {latestEvt.actor?.name && (
                              <span className="truncate">· {latestEvt.actor.name}</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Events Count */}
                    <TableCell className="py-3">
                      <Badge variant="secondary" className="font-normal text-xs bg-muted text-muted-foreground border-border">
                        {app.history_count} {app.history_count === 1 ? 'event' : 'events'}
                      </Badge>
                    </TableCell>

                    {/* Actions: View History Button */}
                    <TableCell className="text-right py-3 pr-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2.5 text-xs font-medium border-border hover:bg-accent text-foreground shadow-2xs"
                          onClick={() => setSelectedApplicant(app)}
                        >
                          <History className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                          View History
                        </Button>
                        <Link 
                          href={`/recruiter/applicants/${app.id}`}
                          className={buttonVariants({ 
                            variant: 'ghost', 
                            size: 'icon-sm', 
                            className: 'text-muted-foreground hover:text-foreground' 
                          })}
                          title="View Application Details"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer summary */}
      <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
        <span>Showing {filteredApplicants.length} of {applicants.length} applicants</span>
      </div>

      {/* History Details Sheet */}
      <ApplicantHistorySheet
        applicant={selectedApplicant}
        open={!!selectedApplicant}
        onOpenChange={(open) => !open && setSelectedApplicant(null)}
      />
    </div>
  )
}
