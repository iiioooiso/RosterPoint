# Architecture & Workflow Specifications

System topology, role-based user journeys, and end-to-end request execution flows for RosterPoint.

---

## 1. System Topology

```
+-------------------------------------------------------------------------------+
|                                 CLIENT LAYER                                  |
|    Next.js 15 (React 19 Server & Client Components, Tailwind CSS, UI Kit)     |
+-------------------------------------------------------------------------------+
                                       │
                                       │ HTTPS / Server Actions & Route Handlers
                                       ▼
+-------------------------------------------------------------------------------+
|                            APPLICATION SERVER LAYER                           |
|   Next.js Runtime (Vercel Serverless Functions)                               |
|   • Authentication & Session Validation (Supabase SSR)                        |
|   • Role-Based Access Control (RBAC: Student, Recruiter, Interviewer)         |
|   • Business Logic, Input Validation & State Machine Transitions              |
|   • Stalled Application Detection Engine                                      |
+-------------------------------------------------------------------------------+
                 │                                              │
                 │ PostgreSQL Protocol / Supabase Client        │ HTTPS / REST
                 ▼                                              ▼
+------------------------------------+         +--------------------------------+
|           DATABASE LAYER           |         |       EXTERNAL SERVICES        |
|   Supabase PostgreSQL              |         |   Resend                       |
|   • Row Level Security (RLS)       |         |   • Automated Stalled Digests  |
|   • Append-Only Audit History      |         |   • Pipeline Notifications     |
|   • Relational Schema Enforcements |         +--------------------------------+
|   • Supabase Storage (Resumes)     |
+------------------------------------+
```

---

## 2. End-to-End Role Workflows

### Candidate / Student Workflow

```
[Candidate Entry]
       │
       ▼
[Authentication] ──→ Sign In / Sign Up / One-Click Demo Access (`/login`)
       │
       ▼
[Student Dashboard] (`/student/dashboard`)
       │
       ├──→ [Search & Select Companies]
       │         │
       │         ├── Browse verified hiring organizations
       │         └── Filter listings by department, position, or keywords
       │
       ├──→ [View Detailed Job Openings]
       │         │
       │         ├── Inspect full job responsibilities and role requirements
       │         └── Review defined hiring pipeline stages and evaluation criteria
       │
       ├──→ [Apply for Open Roles]
       │         │
       │         ├── Upload PDF resume (stored in Supabase Storage)
       │         ├── Complete application details and profile questionnaire
       │         └── Submit entry into initial pipeline stage
       │
       └──→ [Track Applied Jobs]
                 │
                 ├── Monitor live pipeline status (Applied → Review → Interview → Offer / Rejected)
                 └── Inspect immutable stage timeline and status updates
```

| Step | Action | Endpoint / Screen | Outcome |
| :--- | :--- | :--- | :--- |
| **1. Auth** | Authenticate via email or demo profile | `/login` / `/signup` | Session token issued; redirect to role dashboard |
| **2. Discover** | Search companies and browse openings | `/student/dashboard` | Filtered list of active job postings |
| **3. Inspect** | Review job specifications | `/careers/[id]` | Clear visibility into requirements & pipeline stages |
| **4. Apply** | Upload resume and submit profile | Application modal / form | Record inserted into `applications` and initial `stage_history` |
| **5. Track** | View real-time progress & decisions | `/student/dashboard` | Live status tracking across every stage of the pipeline |

---

### Recruiter Workflow

```
[Recruiter Entry]
       │
       ▼
[Authentication] ──→ Sign In / One-Click Recruiter Demo Access (`/login`)
       │
       ▼
[Recruiter Dashboard] (`/recruiter/dashboard`)
       │
       ├──→ [Create & Manage Job Openings] (`/recruiter/create` & `/recruiter/jobs`)
       │         │
       │         ├── Author job specifications (title, role description, department)
       │         ├── Define multi-stage pipeline (e.g., Sift → Tech Screen → Panel → Offer)
       │         └── Publish or archive job listings
       │
       ├──→ [Manage Applicant Pipeline] (`/recruiter/applicants`)
       │         │
       │         ├── View candidates across interactive stage columns
       │         ├── Filter applicants by job opening, stage, or review status
       │         └── Inspect candidate profiles, resumes, and submitted details
       │
       ├──→ [Advance or Reject Candidates] (`/recruiter/applicants/[id]`)
       │         │
       │         ├── Advance qualified candidates to the next sequential stage
       │         ├── Reject candidates with structured rejection reasons
       │         ├── Generate and issue formal offer letters for hired candidates
       │         └── Automatically log every transition to immutable `stage_history`
       │
       ├──→ [Assign Interview Panels] (`/recruiter/interview-panel` & `/recruiter/teams`)
       │         │
       │         ├── Delegate specific candidates to internal interviewers
       │         └── Invite and manage evaluation team members
       │
       └──→ [Monitor Stalled Applications] (`/recruiter/alerts` & `/recruiter/history`)
                 │
                 ├── Identify candidates exceeding stage SLA thresholds
                 ├── Trigger automated Resend email digests to hiring managers
                 └── Inspect tamper-proof system audit logs
```

| Step | Action | Endpoint / Screen | Outcome |
| :--- | :--- | :--- | :--- |
| **1. Auth** | Sign in as Recruiter | `/login` | Access granted to recruiter management suite |
| **2. Configure** | Create job and customize stages | `/recruiter/create` | Job opening published with custom pipeline stages |
| **3. Triage** | Review applicant submissions | `/recruiter/applicants` | Candidate pipeline organized by stage |
| **4. Delegate** | Assign interviewers to stages | `/recruiter/interview-panel` | Assigned candidates appear on interviewer dashboards |
| **5. Decide** | Advance, reject, or offer | `/recruiter/applicants/[id]` | Transition executed; immutable history record appended |
| **6. Monitor** | Review stalled alerts & history | `/recruiter/alerts` | Stalled candidates surfaced; email digests triggered |

---

### Interviewer Workflow

```
[Interviewer Entry]
       │
       ▼
[Authentication] ──→ Sign In / One-Click Interviewer Demo Access (`/login`)
       │
       ▼
[Interviewer Dashboard] (`/interviewer/dashboard`)
       │
       ├──→ [Review Assigned Candidates] (`/interviewer/applications`)
       │         │
       │         ├── Access queue of assigned candidates for active stages
       │         └── Filter by role, department, or urgency
       │
       ├──→ [Inspect Candidate Dossier] (`/interviewer/applications/[id]`)
       │         │
       │         ├── Review resume, background, and candidate responses
       │         └── Examine evaluation rubrics and stage expectations
       │
       ├──→ [Submit Structured Feedback] (`/interviewer/feedback`)
       │         │
       │         ├── Enter quantitative ratings across defined evaluation criteria
       │         ├── Provide detailed qualitative notes and observations
       │         └── Submit definitive recommendation (Advance / Reject / Re-evaluate)
       │
       └──→ [Review Evaluation History] (`/interviewer/history`)
                 │
                 └── Access past submitted scorecards and track candidate outcomes
```

| Step | Action | Endpoint / Screen | Outcome |
| :--- | :--- | :--- | :--- |
| **1. Auth** | Sign in as Interviewer | `/login` | Access granted to evaluation dashboard |
| **2. Queue** | Inspect assigned evaluations | `/interviewer/dashboard` | Clean view of pending candidate interviews |
| **3. Review** | Examine dossier and resume | `/interviewer/applications/[id]` | Informed context ahead of the evaluation session |
| **4. Submit** | Complete scorecard and notes | `/interviewer/feedback` | Feedback recorded immutably for recruiter review |
| **5. History** | Check historical evaluations | `/interviewer/history` | Transparent record of past evaluations and decisions |

---

## 3. End-to-End Request Execution Traces

### Trace 1: Candidate Application Submission

```
[Candidate Client]
       │
       │ 1. Form submit: candidate profile + resume PDF
       ▼
[Next.js Server Action] (`submitApplication`)
       │
       │ 2. Authenticate session & verify student role
       │ 3. Upload resume to Supabase Storage bucket (`resumes/`)
       ▼
[Supabase Storage] ──→ Returns secure document URL
       │
       ▼
[Next.js Server Action]
       │
       │ 4. Atomic database insert:
       │    ├── INSERT INTO `applications` (candidate_id, job_id, current_stage_id, resume_url)
       │    └── INSERT INTO `stage_history` (application_id, stage_id, action: 'applied')
       ▼
[Supabase PostgreSQL]
       │
       │ 5. Enforce Row Level Security (RLS) & commit records
       ▼
[Candidate Client] ──→ Dashboard revalidates with active tracking card
```

---

### Trace 2: Recruiter Stage Progression

```
[Recruiter Client]
       │
       │ 1. Click "Advance Candidate" to target stage
       ▼
[Next.js Server Action] (`advanceApplicationStage`)
       │
       │ 2. Verify recruiter authorization on target job opening
       │ 3. Validate sequential stage transition rule
       ▼
[Supabase PostgreSQL Transaction]
       │
       │ 4. Execute atomic state update:
       │    ├── UPDATE `applications` SET current_stage_id = new_stage_id, updated_at = NOW()
       │    └── INSERT INTO `stage_history` (application_id, from_stage, to_stage, actor_id, notes)
       ▼
[Audit Integrity]
       │
       │ 5. History row is strictly append-only (no modifications allowed)
       ▼
[Recruiter & Student Portals] ──→ Real-time UI reflects updated stage and timeline entry
```

---

### Trace 3: Stalled Candidate SLA Monitor & Email Digest

```
[Automated Cron / Recruiter Trigger] (`/recruiter/alerts`)
       │
       │ 1. Run detection query:
       │    SELECT * FROM applications a
       │    JOIN pipeline_stages s ON a.current_stage_id = s.id
       │    WHERE NOW() - a.updated_at > s.sla_threshold_days
       │    AND a.status = 'active';
       ▼
[Next.js Alert Processing Engine]
       │
       │ 2. Aggregate flagged candidates and calculate duration past SLA
       │ 3. Compile clean summary payload
       ▼
[Resend Notification API]
       │
       │ 4. Dispatch transactional email alert to hiring team
       ▼
[Recruiter Mailbox] ──→ Direct action links to review and unblock stalled candidates
```
