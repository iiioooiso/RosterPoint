import { createClient } from "@/lib/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { 
  ApplicantActions, 
  DownloadDocument, 
  NotesForm, 
  InterviewPanelManager 
} from "./applicant-actions"
import Link from "next/link"
import { 
  ArrowLeft, 
  Building2, 
  Mail, 
  GraduationCap, 
  Calendar, 
  User, 
  FileText, 
  Globe, 
  Clock, 
  Users, 
  MessageSquareQuote, 
  CheckCircle2, 
  XCircle, 
  RotateCcw,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"

// Helper to extract responses from candidate_responses column or parse legacy notes
function extractCandidateResponses(app: any) {
  const responses = app.candidate_responses || {}
  let portfolio: string | null = responses.portfolio || null
  let coverLetter: string | null = responses.cover_letter || null
  let questions: { id?: string; title: string; answer: string; type?: string }[] = responses.questions || []

  // Legacy fallback: if responses is empty and notes contains parsed prefixes, separate them
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

const STAGE_COLORS: Record<string, string> = {
  applied: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
  screening: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
  interview: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900',
  offer: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
  hired: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900'
}

export default async function ApplicantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Fetch application details with opening and documents
  const { data: application, error } = await supabase
    .from('applications')
    .select(`
      *,
      opening:openings(id, title, department, company_id, application_materials),
      documents(*)
    `)
    .eq('id', id)
    .single()

  if (error || !application) {
    console.error("Error fetching application details:", error)
    notFound()
  }

  // 2. Fetch student profile if available
  const { data: studentProfile } = application.student_id ? await supabase
    .from('profiles')
    .select('id, name, university_name, age, sex, company_name, job_title')
    .eq('id', application.student_id)
    .maybeSingle() : { data: null }

  // 3. Fetch assigned interviewers
  const { data: assignedInterviewers } = await supabase
    .from('application_interviewers')
    .select(`
      id,
      interviewer_id,
      created_at,
      interviewer:profiles(id, name, job_title, role)
    `)
    .eq('application_id', id)

  // 4. Fetch available interviewers for assigning
  const { data: allInterviewers } = await supabase
    .from('profiles')
    .select('id, name, job_title, role')
    .eq('role', 'interviewer')

  // 5. Fetch application history / timeline
  const { data: history } = await supabase
    .from('application_history')
    .select(`
      id,
      application_id,
      actor_id,
      event_type,
      details,
      created_at,
      actor:profiles(name)
    `)
    .eq('application_id', id)
    .order('created_at', { ascending: false })

  const { portfolio, coverLetter, questions, internalNotes } = extractCandidateResponses(application)

  const candidateDisplayName = application.candidate_name || studentProfile?.name || 'Unknown Candidate'
  const candidateEmail = application.candidate_email || null

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Navigation & Header */}
      <div className="space-y-4">
        <Link 
          href="/recruiter/applicants"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5 text-xs text-muted-foreground hover:text-foreground -ml-2")}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to All Applicants
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                {candidateDisplayName}
              </h1>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize",
                STAGE_COLORS[application.stage] || "bg-muted text-muted-foreground"
              )}>
                {application.stage}
              </span>
              <span className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-0.5 rounded">
                #{application.id.substring(0, 8)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {application.opening && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Applied for</span>
                  <Link 
                    href={`/recruiter/create?view=detail&id=${application.opening.id}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {application.opening.title}
                  </Link>
                  <span className="text-muted-foreground/60">•</span>
                  <span>{application.opening.department}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Applied {new Date(application.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
              </div>
              {application.source && (
                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[11px] font-normal py-0">
                    Source: {application.source}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Stage Action Controls */}
          <ApplicantActions 
            applicationId={application.id} 
            currentStage={application.stage} 
          />
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Application Content & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Candidate Profile / Contact Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Candidate Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Full Name</p>
                  <p className="font-medium text-foreground mt-0.5">{candidateDisplayName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Email Address</p>
                  {candidateEmail ? (
                    <a href={`mailto:${candidateEmail}`} className="font-medium text-primary hover:underline flex items-center gap-1 mt-0.5">
                      <Mail className="h-3 w-3" />
                      {candidateEmail}
                    </a>
                  ) : (
                    <p className="text-muted-foreground mt-0.5">Not provided</p>
                  )}
                </div>

                {studentProfile?.university_name && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">University / Institution</p>
                    <p className="font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                      <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                      {studentProfile.university_name}
                    </p>
                  </div>
                )}

                {(studentProfile?.age || studentProfile?.sex) && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Demographics</p>
                    <p className="text-foreground mt-0.5">
                      {[
                        studentProfile.age ? `Age: ${studentProfile.age}` : null,
                        studentProfile.sex ? `Sex: ${studentProfile.sex}` : null
                      ].filter(Boolean).join(' • ')}
                    </p>
                  </div>
                )}

                {portfolio && (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium text-muted-foreground">Portfolio / Website</p>
                    <a 
                      href={portfolio.startsWith('http') ? portfolio : `https://${portfolio}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 font-medium mt-0.5"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      {portfolio}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Candidate Screening Questions & Application Responses */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MessageSquareQuote className="h-4 w-4 text-muted-foreground" />
                Application Responses & Screening Questions
              </CardTitle>
              <CardDescription className="text-xs">
                Answers provided directly by the applicant during submission.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-5">
              {/* Cover Letter */}
              {coverLetter && (
                <div className="space-y-1.5 p-4 rounded-md border bg-muted/20">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cover Letter</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {coverLetter}
                  </p>
                </div>
              )}

              {/* Custom Screening Questions */}
              {questions.length > 0 && (
                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div key={q.id || idx} className="space-y-1.5 p-3.5 rounded-md border bg-muted/10">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-foreground">
                          Question {idx + 1}: {q.title}
                        </p>
                        {q.type && (
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider px-1.5 py-0 shrink-0 font-mono text-muted-foreground">
                            {q.type}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-background p-2.5 rounded border border-border/60">
                        <span className="font-semibold text-foreground/80 block mb-1">Applicant's reply:</span>
                        {q.answer || <span className="italic text-muted-foreground/60">No answer provided</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!coverLetter && questions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No additional screening questions were requested for this position.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Candidate Documents */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Submitted Documents
              </CardTitle>
              <CardDescription className="text-xs">
                Candidate resume, portfolio files, and supporting materials.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {application.documents && application.documents.length > 0 ? (
                application.documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/20 hover:bg-muted/30 transition-colors">
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
                <div className="text-center py-4 border rounded-md border-dashed">
                  <p className="text-sm text-muted-foreground">No documents uploaded with this application.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Column: Panel, Notes, and Activity Timeline */}
        <div className="space-y-6">
          {/* Interview Panel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Interview Panel
              </CardTitle>
              <CardDescription className="text-xs">
                Assigned interviewers for candidate evaluation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InterviewPanelManager 
                applicationId={application.id}
                assignedInterviewers={assignedInterviewers || []}
                availableInterviewers={allInterviewers || []}
              />
            </CardContent>
          </Card>

          {/* Internal Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Internal Evaluation Notes
              </CardTitle>
              <CardDescription className="text-xs">
                Private notes visible exclusively to recruiters and interviewers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <NotesForm 
                applicationId={application.id} 
                initialNotes={internalNotes} 
              />
            </CardContent>
          </Card>

          {/* Immutable Application Timeline / History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Application History
              </CardTitle>
              <CardDescription className="text-xs">
                Immutable audit trail of pipeline actions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history && history.length > 0 ? (
                <div className="space-y-3 relative before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-[1px] before:bg-border">
                  {history.map((evt: any) => {
                    let eventLabel = evt.event_type
                    let icon = <Clock className="h-3 w-3 text-muted-foreground" />
                    
                    if (evt.event_type === 'application_created') {
                      eventLabel = `Application submitted in "${evt.details?.stage || 'applied'}"`
                      icon = <Sparkles className="h-3 w-3 text-primary" />
                    } else if (evt.event_type === 'stage_changed') {
                      eventLabel = `Stage moved: ${evt.details?.old_stage} → ${evt.details?.new_stage}`
                      icon = <CheckCircle2 className="h-3 w-3 text-blue-500" />
                    } else if (evt.event_type === 'application_rejected') {
                      eventLabel = `Application rejected from "${evt.details?.from_stage || 'pipeline'}"`
                      icon = <XCircle className="h-3 w-3 text-destructive" />
                    } else if (evt.event_type === 'application_reinstated') {
                      eventLabel = `Application reinstated back to "${evt.details?.to_stage}"`
                      icon = <RotateCcw className="h-3 w-3 text-green-500" />
                    } else if (evt.event_type === 'interviewer_assigned') {
                      eventLabel = `Interviewer assigned`
                      icon = <Users className="h-3 w-3 text-purple-500" />
                    }

                    return (
                      <div key={evt.id} className="relative pl-6 text-xs space-y-0.5">
                        <div className="absolute left-1.5 top-1 h-3 w-3 rounded-full bg-background border flex items-center justify-center">
                          {icon}
                        </div>
                        <p className="font-medium text-foreground">{eventLabel}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(evt.created_at).toLocaleString(undefined, { 
                            dateStyle: 'short', 
                            timeStyle: 'short' 
                          })}
                          {evt.actor?.name && ` by ${evt.actor.name}`}
                        </p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">No history recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
