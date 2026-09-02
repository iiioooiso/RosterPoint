import { createClient } from "@/lib/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DownloadDocument } from "@/app/recruiter/applicants/[id]/applicant-actions"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { getSubmittedFeedback } from "@/app/actions/interviewer-data"
import { FeedbackForm } from "./FeedbackForm"
import { ArrowLeft, Building2, Calendar, FileText, Globe, MessageSquareQuote, User } from "lucide-react"

// Helper to extract responses from candidate_responses column or parse legacy notes
function extractCandidateResponses(app: any) {
  const responses = app.candidate_responses || {}
  let portfolio: string | null = responses.portfolio || null
  let coverLetter: string | null = responses.cover_letter || null
  let questions: { id?: string; title: string; answer: string; type?: string }[] = responses.questions || []

  let internalNotes: string = app.notes || ''
  if (!portfolio && !coverLetter && questions.length === 0 && app.notes) {
    const rawNotes = app.notes as string
    if (rawNotes.includes('Portfolio:') || rawNotes.includes('Cover Letter:') || rawNotes.includes('Q:')) {
      const remainingNotesParts: string[] = []
      const sections = rawNotes.split('\n\n')
      
      for (const sec of sections) {
        if (sec.startsWith('Portfolio:')) {
          portfolio = sec.replace(/^Portfolio:\s*/, '').trim()
        } else if (sec.startsWith('Cover Letter:')) {
          coverLetter = sec.replace(/^Cover Letter:\n*/, '').replace(/^Cover Letter:\s*/, '').trim()
        } else if (sec.startsWith('Q:')) {
          const lines = sec.split('\n')
          const qLine = lines[0]?.replace(/^Q:\s*/, '').trim()
          const aLine = lines.slice(1).join('\n').replace(/^A:\s*/, '').trim()
          if (qLine) {
            questions.push({ title: qLine, answer: aLine })
          }
        } else {
          remainingNotesParts.push(sec)
        }
      }
      internalNotes = remainingNotesParts.join('\n\n')
    }
  }

  return { portfolio, coverLetter, questions, internalNotes }
}

export default async function InterviewerApplicantDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  const feedbackResult = await getSubmittedFeedback()
  const existingFeedback = feedbackResult.feedback?.find(f => f.application_id === id) || null
  const { portfolio, coverLetter, questions, internalNotes } = extractCandidateResponses(application)

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="space-y-3">
        <Link href="/interviewer/dashboard" prefetch={true} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5 text-xs text-muted-foreground hover:text-foreground -ml-2")}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                {application.candidate_name || 'Unknown Candidate'}
              </h1>
              <Badge variant="outline" className="capitalize text-xs">
                Stage: {application.stage}
              </Badge>
              <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded">
                #{application.id.substring(0, 8)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
              {application.opening && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>{application.opening.title}</span>
                  <span className="text-muted-foreground/60">•</span>
                  <span>{application.opening.department}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Applied {new Date(application.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Screening Questions & Responses */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MessageSquareQuote className="h-4 w-4 text-muted-foreground" />
              Application Responses & Screening Questions
            </CardTitle>
            <CardDescription className="text-xs">
              Candidate answers submitted with this application.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {portfolio && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Portfolio / Website</p>
                <a 
                  href={portfolio.startsWith('http') ? portfolio : `https://${portfolio}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex items-center gap-1 font-medium text-sm mt-0.5"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {portfolio}
                </a>
              </div>
            )}

            {coverLetter && (
              <div className="space-y-1.5 p-3.5 rounded-md border bg-muted/20">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cover Letter</p>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{coverLetter}</p>
              </div>
            )}

            {questions.length > 0 && (
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={q.id || idx} className="space-y-1.5 p-3.5 rounded-md border bg-muted/10">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-foreground">{idx + 1}. {q.title}</p>
                      {q.type && (
                        <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0 text-muted-foreground">{q.type}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-background p-2.5 rounded border border-border/60">
                      {q.answer || <span className="italic text-muted-foreground/60">No answer provided</span>}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {!portfolio && !coverLetter && questions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-2">No additional application responses provided.</p>
            )}
          </CardContent>
        </Card>

        {/* Candidate Documents */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Candidate Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {application.documents && application.documents.length > 0 ? (
              application.documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/20">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 bg-primary/10 text-primary rounded flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="truncate">
                      <p className="font-medium text-sm truncate">{doc.filename}</p>
                      <p className="text-xs text-muted-foreground capitalize">{doc.type}</p>
                    </div>
                  </div>
                  <DownloadDocument storagePath={doc.storage_path} filename={doc.filename} />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No documents uploaded.</p>
            )}
          </CardContent>
        </Card>

        {/* Internal Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Internal Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {internalNotes ? (
              <div className="p-3 bg-muted/20 rounded-md border text-sm whitespace-pre-wrap">
                {internalNotes}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No internal notes added.</p>
            )}
          </CardContent>
        </Card>

        {/* Interview Feedback */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Interview Feedback</CardTitle>
            <CardDescription className="text-xs">
              {existingFeedback 
                ? "You have submitted feedback for this candidate." 
                : "Submit your candidate evaluation notes and recommendation."}
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
