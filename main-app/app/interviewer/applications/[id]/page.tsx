import { createClient } from "@/lib/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DownloadDocument } from "@/app/recruiter/applicants/[id]/applicant-actions"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { getSubmittedFeedback } from "@/app/actions/interviewer-data"
import { FeedbackForm } from "./FeedbackForm"

export default async function InterviewerApplicantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch application details (RLS ensures they only see routed applications)
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

  const feedbackResult = await getSubmittedFeedback()
  const existingFeedback = feedbackResult.feedback?.find(f => f.application_id === id) || null

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="mb-4">
            <Link href="/interviewer/dashboard" prefetch={true} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Back to Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {application.candidate_name || 'Unknown Candidate'} (#{application.id.substring(0, 8)})
          </h1>
          <p className="text-muted-foreground">
            {/* @ts-ignore */}
            Applied for <span className="font-medium text-foreground">{application.opening?.title}</span> on {new Date(application.created_at).toLocaleDateString()}
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-muted-foreground/20 capitalize">
              Stage: {application.stage}
            </span>
          </div>
        </div>
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
                  {/* DownloadDocument uses a Server Action to get signed URL securely */}
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
            <CardDescription>Notes added by recruiters.</CardDescription>
          </CardHeader>
          <CardContent>
            {application.notes ? (
              <div className="p-4 bg-muted/30 rounded-md border text-sm whitespace-pre-wrap">
                {application.notes}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No notes have been added yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Interview Feedback</CardTitle>
            <CardDescription>
              {existingFeedback 
                ? "You have already submitted feedback for this candidate." 
                : "Submit your interview feedback. This cannot be edited later."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FeedbackForm applicationId={id} existingFeedback={existingFeedback} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
