# Tech Stack Recommendation

Based on the project requirements for the Hiring Pipeline MVP, the constraints (Supabase/PostgreSQL), the need for a highly polished "Linear/Vercel" aesthetic, and your existing skill set, here is the recommended tech stack.

## 1. Recommended Stack

*   **Frontend:** Next.js (App Router)
*   **Language:** TypeScript (or JavaScript, but TypeScript is strongly recommended for a robust pipeline)
*   **UI/Styling:** Tailwind CSS
*   **Component Library:** shadcn/ui (built on Radix UI)
*   **Backend:** Next.js Server Actions & API Routes + Supabase
*   **Database:** PostgreSQL (via Supabase)
*   **Authentication:** Supabase Auth
*   **AI/ML:** None (Not required for the MVP; keeps scope focused and fast)
*   **Other Important Technologies:**
    *   **Framer Motion:** For sleek micro-interactions and smooth page transitions.
    *   **Recharts or Tremor:** For the dashboard data visualizations.
    *   **Lucide React:** For clean, modern icons.

## 2. Why This Stack

**Product Requirements & Logic:**
The MVP requires strict server-side validation (e.g., preventing illegal stage skips, enforcing role permissions, immutable history logs, and handling bulk actions with partial failures). Next.js Server Actions provide a seamless way to run this secure logic without having to stand up and maintain a completely separate backend API like FastAPI or Node/Express. 

**Premium UI/UX:**
To achieve a sleek, premium, "Linear-like" feel without spending weeks writing CSS, **Tailwind CSS** paired with **shadcn/ui** is the industry standard. shadcn/ui provides beautifully designed, accessible components (modals, tables, forms, cards) that you own and can easily tweak. Paired with **Framer Motion** for subtle layout animations (like moving a candidate across stages), the app will feel incredibly polished.

**MVP Speed & Your Skills:**
You already know React and SQL. Next.js is the most powerful way to build React applications today, and Supabase perfectly complements your SQL skills by providing an instant PostgreSQL database and Auth system. This stack eliminates backend boilerplate, allowing you to focus purely on the complex pipeline logic and the premium frontend experience.

**Maintainability & Scalability:**
Next.js and Supabase are both highly scalable. Relying on Supabase's Row Level Security (RLS) ensures data is safe, while Next.js handles server-side rendering (great for performance) and secure API endpoints. 

## 3. Architecture

The architecture follows a modern, serverless approach keeping infrastructure management to zero:

1.  **Client (Browser):** Next.js Client Components handle the interactive UI, forms, drag-and-drop (if added), and animations.
2.  **Server (Next.js Server Actions):** When a user performs an action (e.g., bulk rejecting candidates or moving a stage), the client calls a Next.js Server Action. This secure server environment handles business logic: validating if the stage jump is legal, checking the user's role, and ensuring history cannot be rewritten.
3.  **Database & Auth (Supabase):** The Next.js server securely communicates with Supabase. Supabase Auth manages sessions, and PostgreSQL stores the relational data (Users, Job Openings, Applications, Events/History). Supabase Row Level Security (RLS) acts as a final safeguard to ensure interviewers can only access their assigned candidates.

## 4. Alternatives Considered

*   **Vite + React (SPA) + FastAPI Backend:**
    *   *Why not:* While you know FastAPI, building and deploying a separate Python API alongside a React frontend doubles your deployment overhead and boilerplate. Next.js collapses this into a single codebase, making the MVP much faster to build.
*   **Firebase / MongoDB:**
    *   *Why not:* The constraints explicitly mandated Supabase and PostgreSQL. Additionally, PostgreSQL's relational nature is a much better fit for this highly relational data (Jobs -> Applications -> Interviewers -> History) than a NoSQL document store.
*   **Material UI (MUI) or Bootstrap:**
    *   *Why not:* While fast to build with, they often look like generic enterprise tools or student projects. They lack the modern, sleek aesthetics out of the box that shadcn/ui and Tailwind provide.

## 5. Final Stack Summary

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js (React) | Application framework handling routing, UI, and client state. |
| **Language** | TypeScript / JavaScript | Type safety (if TS) and core application logic. |
| **UI / Styling** | Tailwind CSS | Utility-first styling for fast, modern, and responsive designs. |
| **Components** | shadcn/ui & Radix UI | Pre-built, accessible, premium UI components (modals, dropdowns, tables). |
| **Backend** | Next.js Server Actions | Secure server-side business logic, validations, and API endpoints. |
| **Database** | PostgreSQL (Supabase) | Core relational database with Row Level Security (RLS). |
| **Auth** | Supabase Auth | User authentication, sessions, and role management. |
| **AI / ML** | N/A | None needed for the core MVP scope. |




Recruiter creates Job Opening
        ↓
Candidates apply
        ↓
Candidate enters pipeline
        ↓
Recruiter decides who should interview
        ↓
Recruiter assigns Interviewer(s)
        ↓
Interviewer sees assigned application
        ↓
Interviewer conducts interview
        ↓
Interviewer leaves feedback
        ↓
Feedback becomes part of immutable history


                         ┌───────────────┐
                         │ Authentication │
                         │    + RBAC      │
                         └───────┬───────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
        ┌──────────┐       ┌────────────┐     ┌────────────┐
        │ Dashboard│       │    Jobs    │     │ Applicants │
        └──────────┘       └─────┬──────┘     └─────┬──────┘
                                  │                   │
                                  │                   ├── Pipeline
                                  │                   ├── Search
                                  │                   ├── Bulk Actions
                                  │                   ├── Export
                                  │                   └── Applicant Detail
                                  │                          │
                                  │                          └── Interviews
                                  │
                                  ▼
                            Applications
                                  │
                 ┌────────────────┼────────────────┐
                 ▼                ▼                ▼
              History           Alerts          Interviews
