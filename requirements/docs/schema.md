# Database Schema & Relational Architecture

Entity specifications, relational topologies, constraint boundaries, intentional denormalizations, and scaling characteristics for RosterPoint.

---

## 1. Table-by-Table Architectural Overview

Rather than raw DDL, this section outlines each core table, its operational responsibility, and its principal columns.

| Table | Architectural Purpose | Key Columns & Types |
| :--- | :--- | :--- |
| **`public.profiles`** | Identity record extending Supabase `auth.users`, storing actor metadata and system role. | `id` (uuid, PK/FK), `role` (enum: student, recruiter, interviewer), `name` (text), `university_name` (text), `company_name` (text), `job_title` (text) |
| **`public.companies`** | Multi-tenant organization entity isolating corporate workspaces. | `id` (uuid, PK), `name` (text), `slug` (text, unique), `created_at` (timestamptz) |
| **`public.departments`** | Functional divisions within an organization (e.g., Engineering, Product). | `id` (uuid, PK), `company_id` (uuid, FK), `recruiter_id` (uuid, FK), `name` (text) |
| **`public.department_members`** | Junction table mapping interviewers to their assigned functional departments. | `department_id` (uuid, PK/FK), `user_id` (uuid, PK/FK), `invitation_id` (uuid, FK) |
| **`public.openings`** | Job requisitions containing role specs, skills, and application requirements. | `id` (uuid, PK), `company_id` (uuid, FK), `recruiter_id` (uuid, FK), `title` (text), `department` (text), `status` (enum), `requirements` (jsonb), `skills` (jsonb), `application_materials` (jsonb) |
| **`public.applications`** | Candidate submissions tracking lifecycle progression through pipeline stages. | `id` (uuid, PK), `student_id` (uuid, FK), `opening_id` (uuid, FK), `stage` (enum), `stage_updated_at` (timestamptz), `candidate_name` (text), `candidate_email` (text), `candidate_responses` (jsonb) |
| **`public.documents`** | Application artifacts (resumes, portfolios) pointing to Supabase Storage objects. | `id` (uuid, PK), `application_id` (uuid, FK), `student_id` (uuid, FK), `storage_path` (text), `filename` (text), `content_type` (text) |
| **`public.application_interviewers`** | Assignment junction assigning specific interviewers to evaluate an application. | `id` (uuid, PK), `application_id` (uuid, FK), `interviewer_id` (uuid, FK), `created_at` (timestamptz) |
| **`public.application_history`** | Immutable append-only audit ledger recording every stage transition and decision. | `id` (uuid, PK), `application_id` (uuid, FK), `actor_id` (uuid, FK), `event_type` (text), `details` (jsonb), `created_at` (timestamptz) |
| **`public.interviews`** | Scheduled interview rounds associated with active candidate applications. | `id` (uuid, PK), `application_id` (uuid, FK), `scheduled_at` (timestamptz), `created_at` (timestamptz) |
| **`public.routing_rules`** | Configurable logic mapping candidate questionnaire criteria to specific departments. | `id` (uuid, PK), `department_id` (uuid, FK), `recruiter_id` (uuid, FK), `conditions` (jsonb), `action` (jsonb), `is_active` (boolean) |
| **`public.interviewer_invitations`** | Tokenized invitation links for onboarding interviewers to departments. | `id` (uuid, PK), `token` (text, unique), `department_id` (uuid, FK), `inviter_id` (uuid, FK), `expires_at` (timestamptz), `accepted_at` (timestamptz) |
| **`public.company_invitations`** | Organization-level invitations for onboarding recruiters or interviewers. | `id` (uuid, PK), `token` (text, unique), `company_id` (uuid, FK), `inviter_id` (uuid, FK), `expires_at` (timestamptz), `accepted_at` (timestamptz) |
| **`public.recruiter_company_memberships`** | Multi-tenant association binding recruiters to authorized companies. | `id` (uuid, PK), `recruiter_id` (uuid, FK), `company_id` (uuid, FK), `status` (text) |
| **`public.interviewer_company_memberships`** | Multi-tenant association binding interviewers to authorized companies. | `id` (uuid, PK), `interviewer_id` (uuid, FK), `company_id` (uuid, FK), `department_id` (uuid, FK), `status` (text) |
| **`public.alert_dismissals`** | State tracker for dismissed stalled-candidate alerts by application stage. | `application_id` (uuid, PK/FK), `stage` (enum), `dismissed_by` (uuid, FK), `dismissed_at` (timestamptz) |

---

## 2. Relational Mapping (One-to-Many vs. Many-to-Many)

```
[companies] ──(1:N)──→ [openings] ──(1:N)──→ [applications] ──(1:N)──→ [application_history]
     │                                              │
     ├──(1:N)──→ [departments]                     ├──(1:N)──→ [documents]
     │                 │                            │
     │                 └──(1:N)──→ [routing_rules]  └──(1:N)──→ [interviews]
     │
     └──(1:N)──→ [company_invitations]

[profiles] ──(1:N)──→ [applications] (as Candidate / Student)
[profiles] ──(1:N)──→ [openings]     (as Recruiter Owner)
```

### One-to-Many Relationships (1:N)
- **`companies` → `openings`:** A company publishes multiple job requisitions; each job belongs strictly to one company.
- **`companies` → `departments`:** A company manages multiple functional departments.
- **`openings` → `applications`:** An opening receives multiple candidate submissions; an application targets a single opening.
- **`profiles` (Student) → `applications`:** A student can apply to multiple job openings.
- **`applications` → `documents`:** An application contains multiple associated files (resume, portfolio, cover letter).
- **`applications` → `application_history`:** An application accumulates an append-only timeline of stage transitions and audit events.
- **`applications` → `interviews`:** An application can have multiple scheduled interview rounds.
- **`departments` → `routing_rules`:** A department defines multiple conditional candidate routing rules.

### Many-to-Many Relationships (M:N via Junctions)
- **`departments` ↔ `profiles` (Interviewers) via `department_members`:**
  - An interviewer can belong to multiple departments (e.g., Frontend and Platform).
  - A department contains multiple interviewers.
  - *Junction Key:* Composite primary key `(department_id, user_id)`.
- **`applications` ↔ `profiles` (Interviewers) via `application_interviewers`:**
  - A single candidate application is evaluated by an interview panel of multiple team members.
  - An interviewer evaluates multiple candidate applications across various jobs.
- **`companies` ↔ `profiles` (Recruiters & Interviewers) via `recruiter_company_memberships` & `interviewer_company_memberships`:**
  - Staff members can be associated with multiple companies over time without duplicating user profiles.

---

## 3. Constraint Boundaries: Database vs. Application Enforcement

```
+-------------------------------------------------------------------------------+
|                             DATABASE CONSTRAINTS                              |
|   • Foreign key integrity (`ON DELETE RESTRICT / CASCADE`)                    |
|   • Primary & composite uniqueness (`(department_id, user_id)`, tokens, slugs)|
|   • Column nullability & state enums (`status`, `stage`, `role`)              |
|   • Append-only audit integrity (`REVOKE UPDATE/DELETE ON application_history`)|
|   • Multi-tenant data isolation via Row Level Security (RLS)                  |
+-------------------------------------------------------------------------------+
                                       ▲
                                       │ Enforces Data Invariants & Access Walls
                                       │
+-------------------------------------------------------------------------------+
|                           APPLICATION CONSTRAINTS                             |
|   • Sequential pipeline stage progression rules (e.g. Applied → Interview)    |
|   • SLA stalled duration calculations (`NOW() - stage_updated_at > threshold`)|
|   • File payload inspections (MIME types, max file sizes, virus validation)   |
|   • Token expiration checks with user-friendly error recovery flows           |
|   • Multi-field application response validations (JSONB schema matching)     |
+-------------------------------------------------------------------------------+
```

### Why the Boundary Was Drawn Here:
- **Database Layer (Absolute Invariants):** Existential data rules must never rely on application code correctness. Foreign keys prevent orphaned applications, composite unique keys prevent duplicate department memberships, and RLS policies guarantee tenant isolation even if server code has bugs. Immutability on `application_history` is locked at the database level to ensure legal compliance and tamper-proof auditing.
- **Application Layer (Fluid Business Workflows):** Pipeline progression logic, custom stage requirements, and document validation belong in application code. Moving these into SQL triggers or check constraints would make pipeline customization brittle, requiring database migrations whenever hiring workflows evolve. Furthermore, application-level checks provide human-readable validation feedback rather than raw database constraint violation errors.

---

## 4. Intentional Denormalizations

| Denormalized Field | Source Table | Architectural Tradeoff |
| :--- | :--- | :--- |
| **`candidate_name` & `candidate_email`** on `applications` | `profiles` | **Preserves point-in-time application snapshots** and accelerates recruiter dashboard queries. Even if a candidate later updates their email or name in their profile, the submitted application retains the historical contact info at the moment of submission. Eliminates heavy join queries across `profiles` and `auth.users` on high-traffic pipeline views. |
| **`stage_updated_at`** on `applications` | `application_history` | **Enables O(1) stalled candidate detection.** Instead of executing costly `MAX(created_at)` aggregations on `application_history` across thousands of historical event rows, queries evaluate stalled SLA status directly against `applications.stage_updated_at`. |
| **`company_id`** on `openings` & `departments` | `companies` | **Direct single-clause RLS filtering.** Storing `company_id` directly avoids multi-hop join traversals (`openings -> recruiter_id -> memberships -> company_id`), keeping Row Level Security policies performant. |
| **`details`, `requirements`, `skills`** (JSONB) on `openings` | Normalized child tables | **Atomic document reads and writes.** Job requirements and skill lists are always read and edited together as a single unit. Avoiding separate relational tables (`opening_skills`, `opening_requirements`) reduces join latency and schema rigidity during job publishing. |

---

## 5. Scaling Analysis: What Breaks First at 100x Data?

```
Current Baseline (~10K Records)          100x Scale (~1M Records)
--------------------------------------   ---------------------------------------
• Direct JSONB scans: < 15ms             • Unindexed JSONB scans: Sequential Scan Bottleneck
• Stalled SLA query on full table: Fast  • Unindexed `stage_updated_at` query: CPU Spike
• Direct COUNT(*) on applications: Fast  • Unindexed Kanban dashboard counts: Slow Page Loads
• Serverless file streaming: Sufficient  • File transfers through serverless: Connection Saturation
```

### 1. Unindexed JSONB Queries on Candidate Responses
- **Failure Mode:** Applications store custom form answers in `candidate_responses jsonb`. At 100x scale, filtering or searching candidate submissions without specialized GIN indexes will trigger sequential table scans, degrading query performance from milliseconds to several seconds.
- **Mitigation:** Implement PostgreSQL GIN indexing: `CREATE INDEX idx_app_responses ON applications USING gin (candidate_responses);`.

### 2. Stalled Application Polling Queries
- **Failure Mode:** Recruiter alerts currently query active applications where `NOW() - stage_updated_at > sla_days`. Scanning through hundreds of thousands of terminal applications (`rejected`, `hired`) to find a small set of stalled records causes massive table scans.
- **Mitigation:** Introduce a partial B-tree index targeting only active pipeline states:
  ```sql
  CREATE INDEX idx_active_stalled_apps 
  ON applications (stage_updated_at, opening_id) 
  WHERE stage NOT IN ('rejected', 'hired');
  ```

### 3. Real-Time Pipeline Metric Aggregations
- **Failure Mode:** Recruiter dashboards compute stage counts via real-time `COUNT(*)` queries grouped by `stage`. At 100x volume, live aggregations across active and archived records will stall the database connection pool.
- **Mitigation:** Transition to asynchronous event-driven counters (e.g., Redis counter caches updated on stage transitions) or periodically refreshed PostgreSQL materialized views.

### 4. Direct Document Ingestion & Storage Bandwidth
- **Failure Mode:** Routing multi-megabyte resume uploads or downloads through Next.js serverless functions consumes execution memory and exhausts database client connection pools.
- **Mitigation:** Offload file transfers entirely to direct client-to-storage signed URLs with S3/Supabase Storage CDN caching, bypassing application servers completely.
