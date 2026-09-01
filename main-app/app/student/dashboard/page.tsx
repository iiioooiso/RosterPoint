import { createClient } from "@/lib/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">My Applications</h1>
        <p className="text-muted-foreground mt-2">Track the status of your applications.</p>
      </div>

      <div className="grid gap-4">
        {!applications || applications.length === 0 ? (
          <Card className="bg-muted/40 border-dashed">
            <CardContent className="flex flex-col items-center justify-center h-48 text-center space-y-2">
              <p className="text-muted-foreground font-medium">No applications yet</p>
              <p className="text-sm text-muted-foreground">When you apply for a position, it will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          applications.map((app) => (
            <Card key={app.id}>
              <CardHeader className="pb-3 flex flex-row justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{app.opening?.title}</CardTitle>
                  <CardDescription>{app.opening?.department}</CardDescription>
                </div>
                <Badge variant={app.stage === 'rejected' ? 'destructive' : 'default'} className="capitalize">
                  {app.stage}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Applied on {new Date(app.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
