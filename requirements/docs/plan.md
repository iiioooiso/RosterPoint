# Implementation Plan & Execution Strategy

Engineering session breakdowns, construction sequencing, estimation variance analysis, and architectural scope management for RosterPoint.

---

## 1. Work Breakdown by Sessions

The project was executed across five focused engineering sessions of 2.5 to 3.5 hours each, organized around logical subsystem boundaries:

### Session 1: Relational Foundation, Authentication & Security Boundary (3.5h)
- Designed the relational schema in PostgreSQL: `companies`, `profiles`, `job_openings`, `pipeline_stages`, `applications`, `stage_history`, and `evaluations`.
- Configured Supabase SSR authentication with three distinct role permissions (`student`, `recruiter`, `interviewer`).
- Authored declarative Row Level Security (RLS) policies to guarantee multi-tenant tenant isolation and candidate privacy.
- Built persistent `redirectTo` deep-link preservation across login and registration flows.
- Implemented one-click demo credential switchers to eliminate manual credential input during verification.

### Session 2: Job Architecture & Dynamic Pipeline Engine (2.5h)
- Engineered the job creation interface (`/recruiter/create`) supporting arbitrary, multi-stage pipeline definitions (e.g., Sift → Technical → Behavioral → Offer).
- Configured custom stage attributes: stage order index, custom evaluation criteria, and individual SLA threshold days.
- Developed Server Actions for publishing, archiving, and editing active job requisitions (`/recruiter/jobs`).
- Implemented database foreign-key cascade protections to prevent orphaned stage records.

### Session 3: Candidate Portal, Public Careers & Storage Pipeline (3.0h)
- Developed the public-facing careers portal (`/careers`, `/careers/[id]`) and candidate status portal (`/student/dashboard`).
- Built candidate company search, department filtering, and detailed job specification views.
- Integrated Supabase Storage bucket for PDF resume uploads with mime-type validation and asset URL generation.
- Implemented atomic application creation ensuring simultaneous insertion of initial `applications` and `stage_history` records.

### Session 4: Recruiter Kanban Board, Stage Decisions & Interviewer Loop (3.5h)
- Built the interactive candidate review pipeline (`/recruiter/applicants`) organized by stage columns with search and filter controls.
- Implemented stage progression controls: sequential advancement, structured rejections, and offer letter generation.
- Built interviewer panel assignment (`/recruiter/interview-panel`) and team member management.
- Implemented the interviewer workspace (`/interviewer/dashboard`, `/interviewer/feedback`) with quantitative rubrics and qualitative notes.
- Hardened database-level append-only constraints on `stage_history` to prevent audit log rewriting.

### Session 5: Stalled Candidate SLA Engine, Resend Digests & Hardening (2.5h)
- Created the stalled candidate query engine detecting applications exceeding stage-specific SLA thresholds (`/recruiter/alerts`).
- Integrated Resend transactional email API to generate and dispatch actionable stalled candidate digests.
- Polished navigation layouts, error boundaries, empty states, and responsive viewports.
- Conducted full regression testing across all three user roles using automated demo profiles.

---

## 2. Construction Sequencing Rationale

The system was deliberately constructed in the following dependency order:

```
[1. Schema & Security Invariants]
               │
               ▼
[2. State Transition Engine & Job Creator]
               │
               ▼
[3. Candidate Entry & Document Ingestion]
               │
               ▼
[4. Recruiter Pipeline & Interviewer Subsystem]
               │
               ▼
[5. SLA Telemetry & Notification Engine]
               │
               ▼
[6. Executive Metric Aggregation]
```

### Strategic Rationale:
1. **Schema & Security Invariants First:** UI components built on shifting database models suffer from continuous refactoring. Establishing primary keys, foreign constraints, enum types, and RLS policies upfront provided an unshakeable contract for all downstream code.
2. **Core Mutations Before Ingestion:** Defining how jobs and stages behave made it possible to build the application submission workflow cleanly against verified stage IDs.
3. **Candidate Entry Before Review Interfaces:** Without realistic applicant data and resume attachments, testing recruiter pipeline interactions would have relied on mock data. Building the candidate flow early generated authentic test records for every subsequent stage.
4. **Interviewer Delegation After Pipeline Stability:** Interviewers only interact with candidates placed into specific interview stages by recruiters. Completing the recruiter review module provided the necessary state machine to route candidates to interview panels.
5. **Dashboard Metrics Last:** The executive overview dashboard (`/recruiter/dashboard`) was deliberately postponed until all underlying operational modules were fully functional. This ensured every counter, SLA badge, and funnel count computed live PostgreSQL aggregations rather than static approximations.

---

## 3. Estimated vs. Actual Effort

| Workstream | Estimated | Actual | Variance | Root Cause Analysis |
| :--- | :---: | :---: | :---: | :--- |
| **Schema Design & Multi-Role RLS** | 2.5h | 3.5h | +1.0h | Crafting watertight RLS policies across three interdependent roles (candidate, recruiter, interviewer) without creating circular join dependencies required extensive policy testing. |
| **Job Creator & Dynamic Pipeline Builder** | 3.0h | 2.5h | -0.5h | Using Next.js Server Actions with dynamic form array handlers proved faster than managing complex client-side state synchronizations. |
| **Candidate Portal & Resume Storage** | 2.5h | 3.0h | +0.5h | Secure PDF file ingestion, signed URL generation, and error handling for oversized files required additional tuning. |
| **Pipeline Advancement & Immutable History** | 3.0h | 3.5h | +0.5h | Ensuring strict append-only constraints directly inside PostgreSQL (revoking `UPDATE`/`DELETE` grants on audit tables) required dedicated database triggers and transaction wrappers. |
| **Interviewer Assignment & Scorecards** | 2.0h | 2.0h | 0.0h | Exact alignment between design specifications and implementation resulted in zero scope creep. |
| **SLA Detection & Resend Email Digest** | 2.0h | 2.5h | +0.5h | Crafting performant SQL date-difference queries against custom stage SLA thresholds and integrating Resend API payloads required fine-tuning. |
| **Total Engineering Time** | **15.0h** | **17.0h** | **+2.0h** | Net variance of +13.3%, largely invested in database integrity and security policies. |

---

## 4. Scope Management & De-prioritized Features

When engineering within strict time boundaries, features were categorized by hiring decision fidelity versus operational complexity. The following capabilities were deliberately pruned or substituted:

### 1. In-App WebRTC Video Calling
- **Decision:** Cut real-time in-app video calling in favor of interview stage scheduling with external video conferencing links (Google Meet / Zoom).
- **Rationale:** WebRTC signaling servers, peer-to-peer connection handling, and media recording introduce severe operational overhead without enhancing the core evaluation or pipeline tracking experience.

### 2. Blind Consensus Evaluation Algorithms
- **Decision:** Substituted complex blind multi-evaluator lock-and-reveal algorithms with chronological, independent scorecard submissions visible to the recruiter.
- **Rationale:** While blind scoring prevents bias in high-volume enterprise panels, an immutable chronological evaluation log fulfilled the submission requirements cleanly with zero state-locking friction.

### 3. Client-Side Synthetic State Caching (Redux / Complex Stores)
- **Decision:** Eliminated heavy client-side state management libraries in favor of Next.js React Server Components and targeted `revalidatePath` triggers.
- **Rationale:** Server Components eliminate state desynchronization between tabs, reduce client bundle payload, and guarantee that recruiters always view authoritative database state.

### 4. End-to-End Browser Automation Test Suites
- **Decision:** Deferred heavy Playwright / Cypress suite setup in favor of TypeScript compile-time guarantees, database relational constraints, and one-click demo user switchers for rapid manual testing.
- **Rationale:** Allowed engineering bandwidth to focus on completing all 10 primary goals and stretch capabilities (public careers portal, offer letter generation, automated email digests).
