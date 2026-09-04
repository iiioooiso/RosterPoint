import { createClient } from "@/lib/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { getActiveCompanyId } from '@/app/actions/company'

export default async function ApplicantsPage() {
  const supabase = await createClient()
  const activeCompanyId = await getActiveCompanyId()

  let query = supabase
    .from('applications')
    .select(`
      id, 
      created_at, 
      stage, 
      student_id,
      candidate_name,
      opening:openings!inner(id, title, department, company_id)
    `)
    .order('created_at', { ascending: false })

  if (activeCompanyId) {
    query = query.eq('opening.company_id', activeCompanyId)
  }

  const { data: applications, error } = await query

  if (error) {
    console.error("Error fetching applications:", error)
  }

  return (
    <div className="space-y-6">


      <div className="grid gap-4">
        {!applications || applications.length === 0 ? (
          <Card className="bg-muted/40 border-dashed">
            <CardContent className="flex flex-col items-center justify-center h-48 text-center space-y-2">
              <p className="text-muted-foreground font-medium">No applicants found</p>
              <p className="text-sm text-muted-foreground">Applications will appear here once submitted.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="border rounded-md divide-y bg-card">
            <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-muted-foreground bg-muted/50">
              <div className="col-span-3">Candidate</div>
              <div className="col-span-3">Opening</div>
              <div className="col-span-2">Date Applied</div>
              <div className="col-span-2">Stage</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {applications.map((app) => (
              <div key={app.id} className="grid grid-cols-12 gap-4 p-4 items-center text-sm">
                <div className="col-span-3 font-medium flex items-center">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3 shrink-0">
                    {(app.candidate_name || app.id).substring(0, 2).toUpperCase()}
                  </div>
                  <span className="truncate">{app.candidate_name || 'Unknown Candidate'} (#{app.id.substring(0, 8)})</span>
                </div>
                <div className="col-span-3 text-muted-foreground truncate">
                  {/* @ts-ignore - Supabase types might not deeply infer joined table arrays/objects correctly depending on setup */}
                  {app.opening?.title}
                </div>
                <div className="col-span-2 text-muted-foreground">
                  {new Date(app.created_at).toLocaleDateString()}
                </div>
                <div className="col-span-2">
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize",
                    app.stage === 'applied' && "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900",
                    app.stage === 'screening' && "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
                    app.stage === 'interview' && "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900",
                    app.stage === 'offer' && "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
                    app.stage === 'hired' && "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800",
                    app.stage === 'rejected' && "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900"
                  )}>
                    {app.stage}
                  </span>
                </div>
                <div className="col-span-2 text-right flex justify-end">
                  <Link 
                    href={`/recruiter/applicants/${app.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs h-8")}
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
