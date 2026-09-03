import Link from "next/link";
import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";
import { LandingNavbar } from "@/components/landing-navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Users, Calendar, ArrowRight, UserCheck, LayoutDashboard, Clock, UserSquare2, ListTodo } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DashboardClient as RecruiterDashboardPreview } from "@/app/recruiter/dashboard/DashboardClient";
import { DashboardClient as InterviewerDashboardPreview } from "@/app/interviewer/dashboard/DashboardClient";
import { JobDetailView } from "@/components/job-detail-view";
import { PreviewWrapper } from "@/components/preview-wrapper";
import { Opening } from "@/lib/types";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function Home(props: Props) {
  const searchParams = await props.searchParams;
  if (searchParams?.code) {
    redirect(`/auth/callback?code=${searchParams.code}`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let dashboardUrl = '/onboarding'
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (profile) {
      const role = profile.role || 'student'
      dashboardUrl = `/${role}/dashboard`
    }
  }

  const mockAlerts = [
    { id: "1", candidate_name: "Alex Chen", opening: { title: "Frontend Engineer" }, stage: "screening", stage_updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
    { id: "2", candidate_name: "Sarah Miller", opening: { title: "Product Manager" }, stage: "interview", stage_updated_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() }
  ];
  
  const mockPipeline = [
    { stage: "applied", count: 12 },
    { stage: "screening", count: 8 },
    { stage: "interview", count: 5 },
    { stage: "offer", count: 1 }
  ];

  const mockRecruiterMetrics = {
    open_positions: 12,
    active_applications: 148,
    interviews_this_week: 24,
    hires_this_month: 4,
    applications_received: Array.from({ length: 13 }).map((_, i) => ({
      week: new Date(Date.now() - (12 - i) * 7 * 24 * 60 * 60 * 1000).toISOString(),
      count: Math.floor(Math.random() * 20) + 5
    })),
    applications_by_opening: [
      { title: "Senior Frontend Engineer", count: 45 },
      { title: "Product Manager", count: 32 },
      { title: "Backend Developer", count: 28 },
    ],
    applications_by_stage: mockPipeline,
  };
  
  const mockOpening: Opening = {
    id: "demo",
    title: "Senior Frontend Engineer",
    company_name: "Demo Corp",
    department: "Engineering",
    type: "Full-time",
    description: "Join our team to build scalable interfaces. We're looking for someone who loves UI/UX and crafting excellent user experiences.",
    requirements: [
      { id: "1", text: "React expertise", required: true },
      { id: "2", text: "TypeScript", required: true },
    ],
    application_materials: {
      resume: { enabled: true, required: true },
      portfolio: { enabled: true, required: false },
      cover_letter: { enabled: false, required: false },
      custom_questions: []
    },
    details: [],
    skills: ["React", "TypeScript", "Next.js"],
    company_id: "1",
    recruiter_id: "demo_recruiter",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    archived_at: null,
    status: "open"
  };
  
  const mockInterviewerData = {
    applications: [
      {
        id: "1",
        candidate_name: "David Kim",
        candidate_email: "david@example.com",
        opening: { title: "Backend Developer", company: { name: "Demo Corp" }, department: "Engineering" },
        stage: "interview",
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-100 dark:bg-zinc-950 text-foreground font-sans antialiased selection:bg-primary/10 selection:text-primary">
      
      <main className="flex-1 flex flex-col items-center w-full relative">
        <LandingNavbar user={user} dashboardUrl={dashboardUrl} />
        
        {/* HERO SURFACE WITH CONTRASTING BACKGROUND */}
        <div className="w-full min-h-[100svh] flex flex-col">
          <div className="w-full p-2 md:p-3.5 lg:p-4 flex-1 flex flex-col">
            <div className="w-full bg-[#E3F2FD] dark:bg-[#0B1521] rounded-[2rem] md:rounded-[3.5rem] border border-border/50 shadow-sm overflow-clip flex flex-col relative flex-1 pt-16 md:pt-20">
              
              {/* SUBTLE NOISE TEXTURE */}
              <div 
                className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none mix-blend-multiply dark:mix-blend-overlay dark:opacity-[0.06]" 
                style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')" }}
              ></div>

              {/* HERO SECTION */}
              <section className="relative z-10 w-full flex flex-col items-center justify-start px-5 pt-2 md:pt-6 pb-4 md:pb-8 lg:pb-10 max-w-6xl mx-auto text-center flex-1">
          {/* TOP SPACER to push the entire content group gently downward */}
          <div className="w-full min-h-0 md:min-h-4 lg:min-h-6 shrink" style={{ flexGrow: 0.8 }} />
          
          <div className="flex flex-col items-center gap-3 md:gap-3.5 max-w-3xl shrink-0">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-bold tracking-tight text-foreground leading-[1.1]">
              Hiring, without the <br className="hidden sm:block" /> spreadsheet chaos.
            </h1>
            <p className="text-base sm:text-lg md:text-[19px] text-muted-foreground leading-relaxed max-w-2xl">
              Manage jobs, applications, interviews, and decisions from a single workspace. RosterPoint brings your entire hiring pipeline together.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center pt-0 mt-1">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-11 px-7 text-[15px] shadow-sm">
                  For Companies
                </Button>
              </Link>
              <Link href={user ? dashboardUrl : "/student/dashboard"} className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full h-11 px-7 text-[15px] shadow-sm border-border">
                  Find Jobs
                </Button>
              </Link>
            </div>
          </div>
          
          {/* MIDDLE SPACER reduced to pull cards closer to the buttons */}
          <div className="w-full min-h-0 md:min-h-4 lg:min-h-6 shrink" style={{ flexGrow: 0.5 }} />
          
          {/* HERO VISUAL (Product Preview) */}
          <div className="w-full max-w-4xl p-1.5 md:p-2.5 bg-white/30 dark:bg-black/20 border border-white/50 dark:border-white/10 rounded-xl md:rounded-2xl shadow-lg backdrop-blur-md shrink-0">
            <div className="grid gap-2 md:gap-3 md:grid-cols-3">
              <Card className="shadow-sm border-white/60 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm transition-colors hover:bg-white/80 dark:hover:bg-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 px-3 pt-2.5 md:px-4 md:pt-3">
                  <CardTitle className="text-[11px] md:text-xs font-medium text-blue-900/70 dark:text-blue-100/60 leading-none">Open Positions</CardTitle>
                  <Briefcase className="h-3 w-3 md:h-3.5 md:w-3.5 text-blue-900/50 dark:text-blue-100/40" />
                </CardHeader>
                <CardContent className="px-3 pb-2.5 md:px-4 md:pb-3">
                  <div className="text-xl md:text-2xl font-bold text-blue-950 dark:text-blue-50 leading-none">12</div>
                  <p className="text-[10px] md:text-[11px] text-blue-900/60 dark:text-blue-100/50 leading-none pt-1">+2 from last month</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-white/60 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm transition-colors hover:bg-white/80 dark:hover:bg-white/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 px-3 pt-2.5 md:px-4 md:pt-3">
                  <CardTitle className="text-[11px] md:text-xs font-medium text-blue-900/70 dark:text-blue-100/60 leading-none">Active Applications</CardTitle>
                  <Users className="h-3 w-3 md:h-3.5 md:w-3.5 text-blue-900/50 dark:text-blue-100/40" />
                </CardHeader>
                <CardContent className="px-3 pb-2.5 md:px-4 md:pb-3">
                  <div className="text-xl md:text-2xl font-bold text-blue-950 dark:text-blue-50 leading-none">148</div>
                  <p className="text-[10px] md:text-[11px] text-blue-900/60 dark:text-blue-100/50 leading-none pt-1">+18 this week</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm border-white/60 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-sm transition-colors hover:bg-white/80 dark:hover:bg-white/10 hidden md:block">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0.5 px-3 pt-2.5 md:px-4 md:pt-3">
                  <CardTitle className="text-[11px] md:text-xs font-medium text-blue-900/70 dark:text-blue-100/60 leading-none">Interviews This Week</CardTitle>
                  <Calendar className="h-3 w-3 md:h-3.5 md:w-3.5 text-blue-900/50 dark:text-blue-100/40" />
                </CardHeader>
                <CardContent className="px-3 pb-2.5 md:px-4 md:pb-3">
                  <div className="text-xl md:text-2xl font-bold text-blue-950 dark:text-blue-50 leading-none">24</div>
                  <p className="text-[10px] md:text-[11px] text-blue-900/60 dark:text-blue-100/50 leading-none pt-1">across 4 roles</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
            </div>
          </div>
        </div>

        {/* VALUE PROP SECTION */}
        <section className="w-full bg-muted/10 border-y border-border/40 py-20 md:py-32">
          <div className="container mx-auto px-6 max-w-6xl text-center">
            <div className="max-w-3xl mx-auto space-y-6">
              <h2 className="text-3xl font-semibold tracking-tight">One platform for your entire hiring lifecycle.</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Hiring usually means jumping between email threads, spreadsheets, and calendar invites. RosterPoint replaces the fragmentation with a clean, structured pipeline where every stakeholder has exactly the context they need.
              </p>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="w-full py-20 md:py-32 px-6 container mx-auto max-w-6xl">
          <div className="mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Everything you need to hire.</h2>
            <p className="text-muted-foreground mt-2 text-lg">Powerful features built around actual workflows.</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Briefcase className="h-5 w-5" />
              </div>
              <h3 className="font-medium text-lg">Job Openings</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Create, manage, and close positions. Define requirements, skills, and details for candidates to see.</p>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <h3 className="font-medium text-lg">Candidate Pipeline</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Track candidates seamlessly through Applied, Screening, Interview, Offer, and Hired stages.</p>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <UserSquare2 className="h-5 w-5" />
              </div>
              <h3 className="font-medium text-lg">Interview Management</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Assign interviewers to candidates. Collect and centralize interview feedback instantly.</p>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <ListTodo className="h-5 w-5" />
              </div>
              <h3 className="font-medium text-lg">Candidate History</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Keep a comprehensive log of application movements, rejections, reinstatements, and interviewer assignments.</p>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="font-medium text-lg">Stalled Tracking</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Automatically highlight applications that have been sitting too long in a single stage to keep the pipeline moving.</p>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <UserCheck className="h-5 w-5" />
              </div>
              <h3 className="font-medium text-lg">Role-Based Workspaces</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">Separate views for Recruiters, Interviewers, and Candidates so everyone only sees what matters to them.</p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="w-full bg-muted/20 border-y border-border/40 py-20 md:py-32 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">How it works</h2>
              <p className="text-muted-foreground mt-3 text-lg">A structured approach to making the final decision.</p>
            </div>
            
            <div className="grid md:grid-cols-5 gap-8 md:gap-4 relative">
              <div className="hidden md:block absolute top-6 left-10 right-10 h-[1px] bg-border/60 z-0"></div>
              
              {[
                { step: "01", title: "Create Role", desc: "Publish an opening with requirements." },
                { step: "02", title: "Collect Applications", desc: "Candidates discover and apply." },
                { step: "03", title: "Move Candidates", desc: "Manage candidates through stages." },
                { step: "04", title: "Assign Interviewers", desc: "Bring the right team members in." },
                { step: "05", title: "Make Decision", desc: "Review feedback and hire." }
              ].map((item, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center text-center space-y-4">
                  <div className="h-12 w-12 rounded-full bg-background border border-border flex items-center justify-center font-mono text-sm font-medium shadow-sm">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 px-2">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ROLE CONTEXTS */}
        <section className="w-full py-20 md:py-32 px-6 container mx-auto max-w-6xl space-y-24">
          {/* For Companies */}
          <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 space-y-6">
              <Badge variant="secondary" className="px-3 py-1 font-medium bg-primary/10 text-primary hover:bg-primary/15 border-none">For Companies</Badge>
              <h2 className="text-3xl font-semibold tracking-tight">See every candidate in one place.</h2>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>Manage multiple openings simultaneously.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>Keep hiring stages organized from screening to offer.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>Identify stalled candidates before they drop off.</span>
                </li>
              </ul>
            </div>
            <div className="flex-1 w-full relative">
              <PreviewWrapper className="h-[500px] bg-card overflow-hidden">
                <div className="w-[200%] h-[1000px] transform scale-50 origin-top-left overflow-y-auto no-scrollbar p-6 pointer-events-none select-none">
                  <RecruiterDashboardPreview 
                    preview={true}
                    alerts={mockAlerts}
                    metrics={mockRecruiterMetrics}
                    upcomingInterviews={[
                      { id: "1", scheduled_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), candidate_name: "David Kim", opening_title: "Backend Developer", interviewers: ["You"] }
                    ]}
                    recentHistory={[
                      { id: "1", event_type: "application_created", created_at: new Date(Date.now() - 3600000).toISOString(), application: { candidate_name: "Emily Wang", opening: { title: "Product Designer" } } },
                      { id: "2", event_type: "stage_changed", details: { new_stage: "interview" }, created_at: new Date(Date.now() - 7200000).toISOString(), application: { candidate_name: "Alex Chen", opening: { title: "Frontend Engineer" } } }
                    ] as any}
                  />
                </div>
              </PreviewWrapper>
            </div>
          </div>

          {/* For Candidates */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-12 lg:gap-20">
            <div className="flex-1 space-y-6">
              <Badge variant="secondary" className="px-3 py-1 font-medium bg-primary/10 text-primary hover:bg-primary/15 border-none">For Candidates</Badge>
              <h2 className="text-3xl font-semibold tracking-tight">Discover and apply to roles seamlessly.</h2>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>Read complete job details and clear requirements.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>Track your application status on your dashboard.</span>
                </li>
              </ul>
              <Link href="/student/dashboard" className="inline-block pt-2">
                <Button variant="outline" className="gap-2">
                  Explore open roles <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="flex-1 w-full relative">
              <PreviewWrapper className="h-[500px] bg-card overflow-hidden">
                <div className="w-[125%] h-[625px] transform scale-[0.8] origin-top-left overflow-y-auto no-scrollbar p-6 pointer-events-none select-none">
                  <JobDetailView opening={mockOpening} alreadyApplied={false} preview={true} />
                </div>
              </PreviewWrapper>
            </div>
          </div>

          {/* For Interviewers */}
          <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 space-y-6">
              <Badge variant="secondary" className="px-3 py-1 font-medium bg-primary/10 text-primary hover:bg-primary/15 border-none">For Interviewers</Badge>
              <h2 className="text-3xl font-semibold tracking-tight">Focused interview feedback.</h2>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>No need to navigate the full recruiter workspace.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>See only the candidates assigned to you.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/30" />
                  <span>Provide direct feedback that stays with the candidate history.</span>
                </li>
              </ul>
            </div>
            <div className="flex-1 w-full relative">
              <PreviewWrapper className="h-[300px] bg-muted/10 overflow-hidden">
                 <div className="w-[150%] h-[450px] transform scale-[0.666] origin-top-left overflow-y-auto no-scrollbar p-6 pointer-events-none select-none">
                    <InterviewerDashboardPreview preview={true} previewData={mockInterviewerData} />
                 </div>
              </PreviewWrapper>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="w-full bg-muted/10 border-t border-border/40 py-24 px-6 text-center">
          <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-4xl font-bold tracking-tight">Build a better hiring process.</h2>
            <p className="text-xl text-muted-foreground">
              Bring openings, candidates, recruiters and interviewers into one workspace today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-12 px-8 text-base">Get Started</Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full h-12 px-8 text-base">Sign In</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-border/40 bg-background py-12">
        <div className="container mx-auto px-6 max-w-6xl flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="space-y-4 max-w-sm">
            <span className="font-bold text-lg tracking-tight text-foreground">RosterPoint</span>
            <p className="text-sm text-muted-foreground">
              The collaborative hiring pipeline and applicant tracking system designed for clarity and focus.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-16 text-sm">
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Platform</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link></li>
                <li><Link href="/signup" className="hover:text-foreground transition-colors">Get Started</Link></li>
              </ul>
            </div>
            <div className="space-y-4 col-span-2 md:col-span-1">
              <h4 className="font-medium text-foreground">Workspaces</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><Link href="/recruiter/dashboard" className="hover:text-foreground transition-colors">Recruiter Dashboard</Link></li>
                <li><Link href="/student/dashboard" className="hover:text-foreground transition-colors">Candidate Dashboard</Link></li>
                <li><Link href="/interviewer/dashboard" className="hover:text-foreground transition-colors">Interviewer Panel</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-6 max-w-6xl mt-12 pt-8 border-t border-border/40 text-sm text-muted-foreground flex justify-between">
          <p>© {new Date().getFullYear()} RosterPoint. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
