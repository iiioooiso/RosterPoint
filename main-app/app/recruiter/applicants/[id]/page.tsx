import { createClient } from "@/lib/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ApplicantActions, DownloadDocument, NotesForm } from "./applicant-actions"
import { Button, buttonVariants } from "@/components/ui/button"
import Link from "next/link"

export default async function ApplicantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch application details
  const { data: application, error } = await supabase
    .from('applications')
    .select(`
      *,
      opening:openings(id, title, department),
      documents(*)
    `)
    .eq('id', id)
    .single()

  if (error || !application) {
    console.error("Error fetching application details:", error)
    notFound()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="mb-4">
            <Button variant="outline" size="sm" render={<Link href="/recruiter/applicants" />} className="gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Back to Applicants
            </Button>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Applicant #{application.student_id.substring(0, 8)}</h1>
          <p className="text-muted-foreground">
            {/* @ts-ignore */}
            Applied for <span className="font-medium text-foreground">{application.opening?.title}</span> on {new Date(application.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Client component for changing stages */}
        <ApplicantActions applicationId={application.id} currentStage={application.stage} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Candidate Documents</CardTitle>
            <CardDescription>Resumes and cover letters provided by the candidate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {application.documents && application.documents.length > 0 ? (
              application.documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 text-primary rounded flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{doc.filename}</p>
                      <p className="text-xs text-muted-foreground capitalize">{doc.type}</p>
                    </div>
                  </div>
                  {/* We pass the path to the client component to get signed URL securely */}
                  <DownloadDocument storagePath={doc.storage_path} />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No documents uploaded.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Internal Notes</CardTitle>
            <CardDescription>Only visible to recruiters and interviewers.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Implement note saving via a Client Component form */}
            <NotesForm applicationId={application.id} initialNotes={application.notes || ''} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
