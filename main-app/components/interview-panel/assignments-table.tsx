'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, X, Loader2, Plus, UserMinus } from 'lucide-react'
import {
  addInterviewerToApplication,
  removeInterviewerFromApplication,
  bulkAddInterviewer,
  bulkRemoveInterviewer
} from '@/app/actions/interview-panel'
import { AddInterviewerDialog } from './add-interviewer-dialog'
import { ApplicationDetailsSheet } from './application-details-sheet'
import { toast } from 'sonner'

export function AssignmentsTable({
  applications,
  totalCount,
  currentPage,
  pageSize,
  allInterviewers,
  departments,
  openings,
  currentFilters
}: any) {
  const router = useRouter()
  const pathname = usePathname()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()

  const [addDialogState, setAddDialogState] = useState<{ open: boolean, applicationIds: string[] }>({ open: false, applicationIds: [] })
  const [detailsSheetId, setDetailsSheetId] = useState<string | null>(null)

  const [searchValue, setSearchValue] = useState(currentFilters.query || '')

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search)
    const oldParamsStr = params.toString()

    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }

    if (params.toString() === oldParamsStr) {
      return // No change, prevent unnecessary re-fetch
    }

    params.set('page', '1') // Reset page on filter change
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    handleFilterChange('q', searchValue)
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === applications.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(applications.map((a: any) => a.id))
    }
  }

  const toggleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(v => v !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleRemoveInterviewer = async (applicationId: string, interviewerId: string) => {
    const res = await removeInterviewerFromApplication(applicationId, interviewerId)
    if (res?.error) {
      toast.error(res.error)
    } else {
      toast.success('Interviewer removed.')
    }
  }

  const handleBulkRemoveInterviewer = async (interviewerId: string) => {
    if (selectedIds.length === 0) return
    const res = await bulkRemoveInterviewer(selectedIds, interviewerId)
    if (res?.success) {
      toast.success(`Removed interviewer from ${res.results?.successCount} application(s).`)
      if (res.results && res.results.failures.length > 0) {
        toast.error(`Failed on ${res.results.failures.length} application(s).`)
      }
      setSelectedIds([])
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <form onSubmit={handleSearch} className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates..."
            className="pl-9 bg-background"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto pb-1 sm:pb-0">
          <Select
            value={currentFilters.department || ""}
            onValueChange={(v) => handleFilterChange('department', v)}
          >
            <SelectTrigger className="w-[160px] bg-background">
              <SelectValue placeholder="Department">
                {currentFilters.department && currentFilters.department !== "all" ? currentFilters.department : "Department"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d: string) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentFilters.opening || ""}
            onValueChange={(v) => handleFilterChange('opening', v)}
          >
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Job Opening">
                {currentFilters.opening && currentFilters.opening !== "all" ? openings.find((o: any) => o.id === currentFilters.opening)?.title || "Job Opening" : "Job Opening"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Openings</SelectItem>
              {openings.map((o: any) => (
                <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentFilters.interviewer || ""}
            onValueChange={(v) => handleFilterChange('interviewer', v)}
          >
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Interviewer">
                {currentFilters.interviewer && currentFilters.interviewer !== "all" ? allInterviewers.find((i: any) => i.id === currentFilters.interviewer)?.name || "Interviewer" : "Interviewer"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Interviewers</SelectItem>
              {allInterviewers.map((i: any) => (
                <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={currentFilters.sort || ""}
            onValueChange={(v) => handleFilterChange('sort', v)}
          >
            <SelectTrigger className="w-[160px] bg-background">
              <SelectValue placeholder="Sort By">
                {currentFilters.sort === 'created_at-desc' ? 'Newest First' :
                 currentFilters.sort === 'created_at-asc' ? 'Oldest First' :
                 currentFilters.sort === 'candidate-asc' ? 'Candidate (A-Z)' :
                 currentFilters.sort === 'candidate-desc' ? 'Candidate (Z-A)' : 'Sort By'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at-desc">Newest First</SelectItem>
              <SelectItem value="created_at-asc">Oldest First</SelectItem>
              <SelectItem value="candidate-asc">Candidate (A-Z)</SelectItem>
              <SelectItem value="candidate-desc">Candidate (Z-A)</SelectItem>
            </SelectContent>
          </Select>

          {(currentFilters.query || currentFilters.department || currentFilters.opening || currentFilters.interviewer || (currentFilters.sort && currentFilters.sort !== 'created_at-desc')) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setSearchValue('')
                router.push(pathname)
              }}
              title="Clear filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-primary/5 border border-primary/20 rounded-md flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium">{selectedIds.length} application(s) selected</span>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setAddDialogState({ open: true, applicationIds: selectedIds })}>
              <Plus className="w-4 h-4 mr-2" />
              Add Interviewer
            </Button>
            {/* Bulk remove would need selecting WHICH interviewer to remove. 
                For simplicity we could just pop a dialog similar to add. 
                We will omit bulk remove UI for brevity unless requested, 
                as Add is the primary bulk action requested. */}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedIds.length > 0 && selectedIds.length === applications.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Candidate</TableHead>
              <TableHead>Opening & Dept</TableHead>
              <TableHead>Interviewers</TableHead>
              <TableHead className="text-right w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-[400px] text-center">
                  {isPending ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
                      <span className="text-sm font-medium">Loading applications...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-12 animate-in fade-in zoom-in-95 duration-300">
                      <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-muted flex items-center justify-center mb-6 shadow-sm">
                        <Search className="w-8 h-8 text-muted-foreground/70" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">No applications found</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
                        {(currentFilters.query || currentFilters.department || currentFilters.opening || currentFilters.interviewer) 
                          ? "We couldn't find any applications matching your current filters. Try adjusting your search."
                          : "There are no applications available for interview panel assignment right now."}
                      </p>
                      {(currentFilters.query || currentFilters.department || currentFilters.opening || currentFilters.interviewer) && (
                        <Button 
                          variant="secondary" 
                          onClick={() => {
                            setSearchValue('')
                            router.push(pathname)
                          }}
                          className="shadow-sm"
                        >
                          Clear all filters
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app: any) => (
                <TableRow key={app.id} className="group">
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(app.id)}
                      onCheckedChange={() => toggleSelectRow(app.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{app.candidate_name || 'Unknown Candidate'}</div>
                    <div className="text-xs text-muted-foreground">{app.candidate_email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{app.opening?.title}</div>
                    <div className="text-xs text-muted-foreground">{app.opening?.department}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {app.interviewers?.slice(0, 3).map((ai: any) => (
                        <Badge key={ai.id} variant="secondary" className="pr-1 font-normal bg-muted border-primary/20">
                          {ai.interviewer?.name}
                          <button
                            className="ml-1 rounded-full p-0.5 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                            onClick={() => handleRemoveInterviewer(app.id, ai.interviewer.id)}
                            title={`Remove ${ai.interviewer?.name}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                      {app.requests?.filter((r: any) => r.status === 'pending').slice(0, 3 - (app.interviewers?.length || 0)).map((r: any) => (
                        <Badge key={r.id} variant="outline" className="pr-1 font-normal border-dashed opacity-70">
                          {r.interviewer?.name} (Pending)
                        </Badge>
                      ))}
                      {((app.interviewers?.length || 0) + (app.requests?.filter((r: any) => r.status === 'pending').length || 0)) > 3 && (
                        <Badge variant="outline" className="font-normal border-dashed">
                          +{((app.interviewers?.length || 0) + (app.requests?.filter((r: any) => r.status === 'pending').length || 0)) - 3}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setAddDialogState({ open: true, applicationIds: [app.id] })}
                        title="Add Interviewer"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setDetailsSheetId(app.id)}>
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Placeholder */}
      <div className="flex justify-between items-center text-sm text-muted-foreground px-1">
        <div>
          Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
        </div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1 || isPending}
            onClick={() => handleFilterChange('page', (currentPage - 1).toString())}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage * pageSize >= totalCount || isPending}
            onClick={() => handleFilterChange('page', (currentPage + 1).toString())}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Dialogs & Sheets */}
      <AddInterviewerDialog
        open={addDialogState.open}
        onOpenChange={(open: boolean) => setAddDialogState({ ...addDialogState, open })}
        applicationIds={addDialogState.applicationIds}
        allInterviewers={allInterviewers}
        onSuccess={() => setSelectedIds([])}
      />

      <ApplicationDetailsSheet
        applicationId={detailsSheetId}
        onOpenChange={(open: boolean) => !open && setDetailsSheetId(null)}
        allInterviewers={allInterviewers}
      />
    </div>
  )
}
