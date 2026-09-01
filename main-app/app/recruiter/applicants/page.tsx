import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"

export default async function ApplicantsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch all applications along with the opening details
  // Note: Recruiter RLS policy must allow selecting these applications
  const { data: applications, error } = await supabase
    .from('applications')
    .select(`
      id, 
      created_at, 
      stage, 
      student_id,
      opening:openings(id, title, department)
    `)
    .order('created_at', { ascending: false })

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
                    {app.student_id.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="truncate">Applicant #{app.student_id.substring(0, 6)}</span>
                </div>
                <div className="col-span-3 text-muted-foreground truncate">
                  {/* @ts-ignore - Supabase types might not deeply infer joined table arrays/objects correctly depending on setup */}
                  {app.opening?.title}
                </div>
                <div className="col-span-2 text-muted-foreground">
                  {new Date(app.created_at).toLocaleDateString()}
                </div>
                <div className="col-span-2">
                  <Badge variant="outline" className="capitalize">
                    {app.stage}
                  </Badge>
                </div>
                <div className="col-span-2 text-right flex justify-end">
                  <Link 
                    href={`/recruiter/applicants/${app.id}`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
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
