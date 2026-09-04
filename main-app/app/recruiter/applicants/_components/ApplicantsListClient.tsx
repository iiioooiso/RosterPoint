'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Search, ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react"
import { bulkUpdateApplications, exportPipelineCSV, BulkUpdateResult } from '@/app/actions/applications'
import { toast } from 'sonner'

type Application = {
  id: string;
  created_at: string;
  stage: string;
  student_id: string;
  candidate_name: string;
  candidate_email?: string;
  source?: string;
  opening: { id: string; title: string; department: string; company_id?: string } | null;
}

export function ApplicantsListClient({ 
  applications, 
  totalCount, 
  openings,
  activeCompanyId
}: { 
  applications: Application[], 
  totalCount: number,
  openings: { id: string, title: string }[],
  activeCompanyId: string | null
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '')
  const [isExporting, setIsExporting] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const [bulkActionState, setBulkActionState] = useState<{
    isOpen: boolean;
    isPending: boolean;
    results: BulkUpdateResult[] | null;
    actionType: string | null;
  }>({
    isOpen: false,
    isPending: false,
    results: null,
    actionType: null,
  })

  const STAGE_MAP: Record<string, string> = {
    all: 'All Stages',
    applied: 'Applied',
    screening: 'Screening',
    interview: 'Interview',
    offer: 'Offer',
    hired: 'Hired',
    rejected: 'Rejected'
  };

  const SORT_MAP: Record<string, string> = {
    'created_at-desc': 'Newest First',
    'created_at-asc': 'Oldest First',
    'stage-asc': 'Stage (Ascending)',
    'stage-desc': 'Stage (Descending)'
  };

  const OPENINGS_MAP = openings.reduce((acc, op) => {
    acc[op.id] = op.title;
    return acc;
  }, {} as Record<string, string>);
  OPENINGS_MAP['all'] = 'All Openings';

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateUrlParam('q', searchTerm)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const updateUrlParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    if (key !== 'page') {
      params.set('page', '1') // Reset to page 1 on filter changes
    }
    router.push(`${pathname}?${params.toString()}`)
  }, [searchParams, pathname, router])

  const page = parseInt(searchParams.get('page') || '1')
  const totalPages = Math.ceil(totalCount / 10) || 1

  const toggleSelectAll = () => {
    if (selectedIds.length === applications.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(applications.map(a => a.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleBulkAction = async (actionType: 'advance' | 'reject') => {
    setBulkActionState({ isOpen: true, isPending: true, results: null, actionType })
    const results = await bulkUpdateApplications(selectedIds, actionType)
    setBulkActionState(prev => ({ ...prev, isPending: false, results }))
    setSelectedIds([])
  }

  const handleExportCSV = async () => {
    if (!activeCompanyId) {
      toast.error('No active company selected')
      return
    }
    setIsExporting(true)
    try {
      const result = await exportPipelineCSV(activeCompanyId)
      if (result.error) {
        toast.error(result.error)
      } else if (result.csv) {
        const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `pipeline_export_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
        toast.success('Export successful')
      }
    } catch (e) {
      toast.error('Failed to export CSV')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Applicants</h1>
          <p className="text-sm text-muted-foreground">Manage and filter your hiring pipeline.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={isExporting} className="gap-2">
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export CSV
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center w-full">
        <div className="relative flex-1 w-full min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-transparent border-none shadow-none font-medium hover:bg-muted/40 focus-visible:bg-muted/40 h-9 transition-colors w-full"
          />
        </div>
        
        <div className="flex flex-wrap md:flex-nowrap items-center gap-2 w-full md:w-auto">
          {mounted && (
            <Select 
              key={`opening-${searchParams.get('opening') || 'all'}`}
              defaultValue={searchParams.get('opening') || 'all'} 
              onValueChange={(val) => val && updateUrlParam('opening', val === 'all' ? '' : val)}
            >
              <SelectTrigger className="h-9 bg-transparent border-none hover:bg-muted/40 shadow-none font-medium w-full md:w-[160px]">
                <SelectValue placeholder="All Openings">
                  {OPENINGS_MAP[searchParams.get('opening') || 'all'] || 'All Openings'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Openings</SelectItem>
                {openings.map(op => (
                  <SelectItem key={op.id} value={op.id}>{op.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {mounted && (
            <Select 
              key={`stage-${searchParams.get('stage') || 'all'}`}
              defaultValue={searchParams.get('stage') || 'all'} 
              onValueChange={(val) => val && updateUrlParam('stage', val === 'all' ? '' : val)}
            >
              <SelectTrigger className="h-9 bg-transparent border-none hover:bg-muted/40 shadow-none font-medium w-full md:w-[140px]">
                <SelectValue placeholder="All Stages">
                  {STAGE_MAP[searchParams.get('stage') || 'all'] || 'All Stages'}
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
          )}

          {mounted && (
            <Select 
              key={`sort-${searchParams.get('sort') || 'created_at-desc'}`}
              defaultValue={searchParams.get('sort') || 'created_at-desc'} 
              onValueChange={(val) => val && updateUrlParam('sort', val)}
            >
              <SelectTrigger className="h-9 bg-transparent border-none hover:bg-muted/40 shadow-none font-medium w-full md:w-[160px]">
                <SelectValue placeholder="Sort By">
                  {SORT_MAP[searchParams.get('sort') || 'created_at-desc'] || 'Sort By'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Newest First</SelectItem>
                <SelectItem value="created_at-asc">Oldest First</SelectItem>
                <SelectItem value="stage-asc">Stage (Ascending)</SelectItem>
                <SelectItem value="stage-desc">Stage (Descending)</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-md p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium text-primary ml-2">{selectedIds.length} candidate(s) selected</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => handleBulkAction('reject')}>
              Reject Selected
            </Button>
            <Button size="sm" className="h-8" onClick={() => handleBulkAction('advance')}>
              Advance Selected
            </Button>
          </div>
        </div>
      )}

      {/* Data Table */}
      {!applications || applications.length === 0 ? (
        <Card className="bg-muted/20 border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-48 text-center space-y-2">
            <p className="text-muted-foreground font-medium">No applicants found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-md divide-y shadow-sm bg-card overflow-hidden">
          <div className="grid grid-cols-12 gap-4 p-3.5 text-xs font-semibold text-muted-foreground bg-muted/30 items-center">
            <div className="col-span-4 flex items-center gap-3">
              <Checkbox 
                checked={selectedIds.length > 0 && selectedIds.length === applications.length} 
                onCheckedChange={toggleSelectAll} 
              />
              Candidate
            </div>
            <div className="col-span-3">Opening</div>
            <div className="col-span-2">Date Applied</div>
            <div className="col-span-2">Stage</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          
          <div className="divide-y">
            {applications.map((app) => (
              <div key={app.id} className="grid grid-cols-12 gap-4 p-3.5 items-center text-sm hover:bg-muted/30 transition-colors">
                <div className="col-span-4 font-medium flex items-center gap-3">
                  <Checkbox 
                    checked={selectedIds.includes(app.id)} 
                    onCheckedChange={() => toggleSelect(app.id)} 
                  />
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    {(app.candidate_name || app.id).substring(0, 2).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <p className="truncate font-medium">{app.candidate_name || 'Unknown Candidate'}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{app.candidate_email || `#${app.id.substring(0, 8)}`}</p>
                  </div>
                </div>
                <div className="col-span-3 text-muted-foreground text-xs truncate font-medium">
                  {(app.opening as any)?.title}
                </div>
                <div className="col-span-2 text-muted-foreground text-xs">
                  {mounted ? new Date(app.created_at).toLocaleDateString() : app.created_at.split('T')[0]}
                </div>
                <div className="col-span-2">
                  <span className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide uppercase",
                    app.stage === 'applied' && "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
                    app.stage === 'screening' && "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
                    app.stage === 'interview' && "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
                    app.stage === 'offer' && "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
                    app.stage === 'hired' && "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300",
                    app.stage === 'rejected' && "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                  )}>
                    {app.stage}
                  </span>
                </div>
                <div className="col-span-1 text-right flex justify-end">
                  <Link 
                    href={`/recruiter/applicants/${app.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs h-7 px-3 bg-transparent border-border/50 hover:bg-muted/50 text-foreground font-medium")}
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground font-medium">
            Showing <span className="text-foreground">{(page - 1) * 10 + 1}</span> to <span className="text-foreground">{Math.min(page * 10, totalCount)}</span> of <span className="text-foreground">{totalCount}</span> results
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1"
              disabled={page <= 1}
              onClick={() => updateUrlParam('page', (page - 1).toString())}
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <div className="text-sm font-medium px-2">Page {page} of {totalPages}</div>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1"
              disabled={page >= totalPages}
              onClick={() => updateUrlParam('page', (page + 1).toString())}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Results Dialog */}
      <Dialog open={bulkActionState.isOpen} onOpenChange={(open) => setBulkActionState(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Action Results</DialogTitle>
            <DialogDescription>
              {bulkActionState.isPending ? 'Processing updates...' : `Attempted to update ${bulkActionState.results?.length} candidate(s).`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto space-y-3">
            {bulkActionState.isPending ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              bulkActionState.results?.map(result => (
                <div key={result.id} className="flex items-start justify-between border-b border-border/50 pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{result.name}</p>
                    {result.reason && <p className="text-xs text-rose-500 mt-0.5">{result.reason}</p>}
                  </div>
                  {result.status === 'success' ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 uppercase text-[10px]">Success</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 uppercase text-[10px]">Failed</Badge>
                  )}
                </div>
              ))
            )}
          </div>
          {!bulkActionState.isPending && (
            <DialogFooter>
              <Button onClick={() => setBulkActionState(prev => ({ ...prev, isOpen: false }))}>Close</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
