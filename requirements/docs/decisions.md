# Decisions

Architectural, engineering, and product decisions that shaped the RosterPoint codebase.

---

## Decision 1: Deep-Link Authentication State Preservation (`redirectTo`)

- **Chose:** Preserving target destination URLs via a persistent `redirectTo` query parameter throughout the entire authentication lifecycle (login, registration, and onboarding).
- **Rejected:** Blindly redirecting all authenticated users to static default landing routes (`/student/dashboard` or `/recruiter/dashboard`).
- **Why:** During team invitation workflows—such as an interviewer or recruiter joining an organization via a tokenized link (`/invite/interviewer/[token]`)—users frequently need to sign in or create credentials mid-flow. Static redirection breaks user context, forces users to manually locate and re-click external invite links, and risks orphaned invitation tokens. Capturing and preserving `redirectTo` across authentication handshakes guarantees uninterrupted deep-linking into private team spaces regardless of session state.

---

## Decision 2: Bottom-Up Module Engineering Over Premature Dashboard Aggregation

- **Chose:** Developing individual operational sub-modules (Job Creation, Multi-Stage Kanban Pipeline, Applicant Dossier Actions, and Stalled Alerts) first, and only engineering the main Recruiter Overview Dashboard after all underlying transactional workflows were fully functional.
- **Rejected:** Starting with a top-down executive overview dashboard populated with mock telemetry, hardcoded metrics, or speculative analytics widgets.
- **Why:** Designing the executive dashboard first inevitably produces rigid, synthetic metrics that fail to reflect the actual operational state of the database. By completing the transactional systems first—such as real stage progressions, applicant status updates, and SLA elapsed calculations—the recruiter command dashboard could compute 100% genuine, live metrics directly from PostgreSQL without requiring synthetic placeholders or post-hoc refactoring.

---

## Decision 3: Multi-Tenant Architecture with Scoped Role-Based Access Control

- **Chose:** Designing a multi-tenant relational schema partitioned by `company_id` foreign keys, paired with granular role-based permissions (Student, Recruiter, Interviewer).
- **Rejected:** Single-tenant hardcoded deployment or isolated database instances per organization.
- **Why:** Building multi-tenant foundations from day one ensures the platform cleanly scales to support multiple independent organizations without data cross-contamination. Recruiters and interviewers operate strictly within their verified corporate boundaries, job openings remain isolated to their publishing company, and candidates maintain a unified profile capable of applying across multiple employers seamlessly.

---

## Decision 4: Local Dockerized Supabase CLI Migrations Over Direct Cloud Console Prototyping

- **Chose:** Version-controlled SQL migration files developed and verified locally using the Dockerized Supabase CLI environment before deploying upstream to production.
- **Rejected:** Authoring and altering database schemas, tables, and security policies directly inside the hosted Supabase cloud dashboard.
- **Why:** Direct cloud console editing introduces unversioned schema drift, makes rollbacks unpredictable, and prevents reproducible environment seeding. Local containers provide an isolated sandbox where migrations, trigger logic, and seed data can be verified and reset instantaneously with zero risk to production environments.
- **Later reversed:** During the initial repository bootstrap, we briefly configured schemas directly inside the Supabase cloud console for rapid prototyping. However, as foreign key dependencies and custom pipeline stage tables multiplied, synchronizing team state became error-prone. We reversed this approach, exported the schema into versioned SQL migration files, and mandated local Dockerized testing for all subsequent database alterations.

---

## Decision 5: Database-Enforced Immutable Audit Logs & Automatic RLS

- **Chose:** Enforcing the append-only nature of the `stage_history` table at the database layer with strict PostgreSQL privileges (revoking `UPDATE` and `DELETE` access) and automating Row Level Security (RLS) across all tables via database event triggers.
- **Rejected:** Managing history tracking solely through application-level ORM/server logic with standard mutable database tables.
- **Why:** Application-level audit logging is vulnerable to developer omissions, partial execution during unhandled exceptions, and accidental row mutation. Enforcing immutability directly in PostgreSQL guarantees that hiring stage histories, feedback timestamps, and decision trails cannot be rewritten or tampered with by any application layer or actor, fulfilling critical hiring compliance requirements.
