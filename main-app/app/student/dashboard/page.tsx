import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ApplicationsSheet } from "./applications-sheet"

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Fetch applications
  const { data: applications } = await supabase
    .from('applications')
    .select('*, opening:openings(title, department)')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })

  // Fetch active openings
  const { data: openings } = await supabase
    .from('openings')
    .select('id, title, department, created_at')
    .eq('status', 'open')
    .is('archived_at', null)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto space-y-8 pt-0 pb-8">
      
      {/* Available Openings Section */}
      <section className="space-y-6">
        <div className="border-b pb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium tracking-tight text-foreground">Available Positions</h3>
            <p className="text-sm text-muted-foreground mt-1">Explore and apply for open roles.</p>
          </div>
          {/* Applications Slide-over Trigger */}
          <ApplicationsSheet applications={applications || []} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {!openings || openings.length === 0 ? (
            <Card className="col-span-full bg-muted/40 border-dashed">
              <CardContent className="flex flex-col items-center justify-center h-48 text-center space-y-2">
                <p className="text-muted-foreground font-medium">No open positions right now</p>
                <p className="text-sm text-muted-foreground">Check back later for new opportunities.</p>
              </CardContent>
            </Card>
          ) : (
            openings.map((opening) => (
              <Link key={opening.id} href={`/careers/${opening.id}`} className="block group">
                <Card className="h-full transition-all hover:border-primary/50 hover:shadow-sm flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="space-y-1">
                      <h3 className="text-base font-medium group-hover:text-primary transition-colors">{opening.title}</h3>
                      <CardDescription>{opening.department}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Posted on {new Date(opening.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                  <div className="px-6 pb-6 mt-auto">
                    <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 w-full">
                      View Details
                    </div>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
