# Roaster Point - Main app

This is the main web application for the Roaster Point platform, built with [Next.js](https://nextjs.org/) using the App Router. It serves as a comprehensive hiring and recruitment platform supporting multiple user roles including recruiters, interviewers, and students/candidates.

## <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 8px;"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg> Project Structure

The repository is organized into the following key directories, each serving a specific purpose in the application's architecture:

### `/app`
The root of the Next.js App Router. This directory contains all the pages, layouts, and API routes of the application. It is structured around user roles and features:
- **`/(auth)` & `/auth`**: Authentication flows, middleware, and pages.
- **`/(recruiter)` & `/recruiter`**: Recruiter-facing dashboards, candidate management, and hiring workflows.
- **`/interviewer`**: Interfaces for interviewers to view schedules, evaluate candidates, and submit feedback.
- **`/student`**: Candidate/student portal for viewing job openings, applying to roles, and tracking application status.
- **`/careers`**: Public-facing job boards and company filter pages.
- **`/api`**: Backend Next.js API route handlers.
- **`/actions`**: Next.js Server Actions for handling form submissions and data mutations.

### `/components`
Contains all React components used across the application to build the user interface.
- **`/ui`**: Generic, reusable design system components (built with Tailwind CSS / shadcn/ui).
- **Domain Components**: Specific feature components like `job-detail-view`, `company-selector`, `landing-navbar`, and role-based navigation (headers/sidebars).

### `/lib`
Core utilities, shared types, and application configuration.
- **Supabase Integration**: Contains `client.ts`, `server.ts`, and middleware configurations for connecting to the Supabase database and handling robust authentication.
- **Types**: Shared TypeScript interfaces and types (`types.ts`).

### `/hooks`
Custom React hooks for encapsulating reusable stateful logic and side effects (e.g., `use-mobile.ts`, `use-cached-action.ts`).

### `/supabase`
Configuration and infrastructure as code for the Supabase backend.
- Contains the local configuration (`config.toml`), and database seeding scripts (`seed.sql`) for local development and testing.

### `/public`
Static assets such as images, fonts, and icons that are served directly to the browser.

## <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 8px;"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg> Getting Started

First, install the dependencies:

```bash
npm install
# or yarn install / pnpm install
```

Set up your environment variables by copying the example file:

```bash
cp .env.example .env.local
```
*(Make sure to populate `.env.local` with your actual Supabase credentials and other required keys)*

Run the development server:

```bash
npm run dev
# or yarn dev / pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: text-bottom; margin-right: 8px;"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> Tech Stack
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
