# AI prompts

# 1. Prompt : 
# Tech Stack Analysis

Go through **all the `.md` files in this project** and understand the product, its requirements, features, user flows, and technical needs.

Based on the project requirements, determine the **best tech stack for building the MVP**.

### My Skills

* Python
* C++
* JavaScript
* SQL
* React
* Node.js
* FastAPI
* REST APIs
* Git/GitHub
* AWS
* Docker
* MongoDB
* PostgreSQL
* Firebase
* Machine Learning
* Data Science
* Generative AI
* LLMs
* RAG
* AI Agents
* Prompt Engineering

Prefer technologies I already know when they are a good fit, but **do not force a technology just because I know it**. Choose what is best for the project.

### MVP Constraints

We will use:

* **Supabase** for backend services
* **PostgreSQL / SQL** as the database

The goal is to keep the MVP:

* Fast to build
* Simple
* Free/low-cost
* Easy to maintain
* Easy to iterate on
* Scalable enough for future growth

### UI/UX Requirement

The application must feel **sleek, premium, and modern**, rather than like a basic student project.

The design quality should take inspiration from modern products such as:

* Linear
* Vercel
* Stripe
* Notion
* Raycast
* Apple
* Modern AI products

The stack should support polished:

* Typography
* Spacing and layouts
* Responsive design
* Dashboards
* Cards
* Tables
* Forms
* Modals / drawers
* Loading and empty states
* Animations and micro-interactions
* Data visualizations
* Modern component patterns

Evaluate technologies such as **React, Next.js, Vite, TypeScript, Tailwind CSS, shadcn/ui, Radix UI, animation libraries, charting libraries, etc.** and select only what is actually appropriate for this project.

### Deliverable

After reading and understanding all the project documentation, create:

`TECH-STACK.md`

Keep it concise and include:

1. **Recommended Stack**

   * Frontend
   * Language
   * UI/styling
   * Component library
   * Backend
   * Database
   * Authentication
   * AI/ML, if required
   * Other important technologies

2. **Why This Stack**

   * Explain why it fits the project's actual requirements.
   * Explain how it supports fast MVP development and premium UI.

3. **Architecture**

   * Give a simple overview of how the frontend, Supabase, database, and any additional backend/AI services interact.

4. **Alternatives Considered**

   * Mention only the important alternatives.
   * Briefly explain why they were not selected.

5. **Final Stack Summary**

| Layer        | Technology | Purpose |
| ------------ | ---------- | ------- |
| Frontend     |            |         |
| Language     |            |         |
| UI / Styling |            |         |
| Components   |            |         |
| Backend      |            |         |
| Database     |            |         |
| Auth         |            |         |
| AI / ML      |            |         |

### Important

**Read the project `.md` files first and base the recommendation on the actual product requirements.**

Do not blindly choose popular technologies.

Do not over-engineer the MVP.

Prioritize:

**Product requirements → Premium UI/UX → MVP speed → Supabase/SQL → My existing skills → Maintainability → Future scalability**

**Do not implement the project yet. Only create `TECH-STACK.md`.**

OUTPUT :

Frontend & Backend: Next.js (App Router with Server Actions)
Language: TypeScript (or JavaScript)
UI & Styling: Tailwind CSS, shadcn/ui, Radix UI
Database & Auth: PostgreSQL and Supabase Auth
Extras: Framer Motion (micro-interactions) and Recharts/Tremor (dashboard charts)




2. Auth PLAN : 
# Implement Supabase Authentication Flow

This document details the plan to implement a complete, robust authentication flow for RosterPoint, adhering strictly to the "premium, minimal" design aesthetic and the database requirements specified.

## User Review Required

- **Roles & Sign Up Strategy**: Users will select their role (`recruiter` or `interviewer`) during sign up. The sign-up form will include a role selector. I will add a trigger in the database to map the role from the auth meta-data into a new `public.profiles` table.
- **UI Components**: Since I cannot run `shadcn` CLI (as docker and application run commands are disabled), I will manually create high-quality, minimal UI components (Button, Input, Label, Card) that strictly adhere to the `ui-enhancement.md` rules (subtle borders, clean surfaces, robust typography) using Tailwind.

## Open Questions

None currently. The requirements from `README.md` and `ui-enhancement.md` are clear.

## Proposed Changes

---

### Database / Migrations

The roles need to be enforced at the server level. We'll introduce a `profiles` table to track this alongside the auth users.

#### [NEW] `supabase/migrations/20260831000000_auth_roles.sql`
- Create an enum `user_role` (`recruiter`, `interviewer`).
- Create a `public.profiles` table linking to `auth.users` with the role.
- Enable RLS on `public.profiles`.
- Create a trigger on `auth.users` to automatically populate `public.profiles` when a user signs up. The role will be extracted from `raw_user_meta_data`.

---

### Supabase Actions & Auth Routes

#### [NEW] `app/auth/actions.ts`
- Implement Next.js Server Actions:
  - `signInAction(formData: FormData)`
  - `signUpAction(formData: FormData)`
  - `signOutAction()`
  - `resetPasswordAction(formData: FormData)`

#### [NEW] `app/auth/confirm/route.ts`
- Route handler for verifying the email confirmation token and exchanging it for a session.

#### [MODIFY] `lib/middleware.ts`
- Adjust the redirection logic to point to `/login` (instead of `/auth/login` if that was the default).

#### [NEW] `middleware.ts` (Root)
- Export the middleware config to ensure routes outside `/login`, `/signup`, `/forgot-password`, etc. are protected by `lib/middleware.ts`.

---

### Authentication UI & Pages

All UI will be highly minimal, Apple-like, and refined.

#### [NEW] `app/(auth)/layout.tsx`
- A minimal centered layout for all auth pages with the RosterPoint logo.

#### [NEW] `app/(auth)/login/page.tsx`
- Login form handling email/password and displaying appropriate loading/error states.

#### [NEW] `app/(auth)/signup/page.tsx`
- Sign-up form including Email, Password, and a Role selector (Recruiter vs. Interviewer).

#### [NEW] `app/(auth)/forgot-password/page.tsx`
- Form for requesting a password reset link.

#### [NEW] `app/(auth)/reset-password/page.tsx`
- Form to set a new password, navigated to after clicking the email link.

#### [NEW] `components/ui/button.tsx`
#### [NEW] `components/ui/input.tsx`
#### [NEW] `components/ui/label.tsx`
- Polished, accessible Tailwind implementations of the core inputs to guarantee the premium feel requested.

---

### App Entry Points

#### [MODIFY] `app/page.tsx`
- Update the "Log in" and "Get Started" placeholders to navigate to `/login` and `/signup` respectively.

## Verification Plan

### Automated Tests
- N/A for this stage, as test commands are not yet configured.

### Manual Verification
Once Docker/Supabase is available, the following must be tested manually:
1. Running migrations using `supabase db push` or similar.
2. Sign up flow for both a Recruiter and Interviewer.
3. Login flow with valid/invalid credentials.
4. Logging out.
5. Attempting to access protected routes without a session.
6. Email confirmation (using InBucket in local Supabase).
7. Forgot password flow.



My correction : 
What I'd change
Don't automatically trust the role from raw_user_meta_data.
Metadata supplied during signup can be user-controlled. The DB trigger can validate that the value is exactly recruiter or interviewer, but authorization should ultimately rely on the profiles row + RLS/server-side checks.
Add proper RLS policies.
“Enable RLS” alone isn't enough. The migration needs explicit policies, e.g. users can read/update their own profile, while role changes should not be freely user-editable.
Password reset needs the callback flow.
/reset-password needs to correctly establish the recovery session from Supabase before calling updateUser().
Email confirmation should be handled carefully.
The /auth/confirm route should exchange the verification code and redirect safely. Avoid accepting arbitrary redirect URLs to prevent open-redirect issues.
The middleware description is slightly vague.
It should clearly define which routes are public and which are protected, rather than simply saying “routes outside login/signup are protected.”
Add authenticated-user redirect behavior.
If someone already has a session and visits /login or /signup, redirect them appropriately rather than showing the auth form again.
Don't manually recreate shadcn if it's already installed.
First inspect the existing components/ui setup. If the components already exist, customize/reuse them rather than creating duplicates.



Correction Prompt :
Update the existing implementation plan based on the current project state.

Important corrections:

1. shadcn/ui is ALREADY installed and configured.
   I have already added the required components:
   Button, Input, Label, Card, Avatar, Badge, Breadcrumb, Calendar, Checkbox, Command, Dialog, Dropdown Menu, Form, Hover Card, Popover, Select, Separator, Sheet, Sidebar, Skeleton, Sonner, Switch, Table, Tabs, Textarea, Toast, Tooltip, Navigation Menu, Scroll Area, and Pagination.

2. Remove the outdated plan section saying shadcn CLI cannot be used or that Button/Input/Label/Card need to be manually created.

3. Do NOT create duplicate shadcn components. Reuse the existing `components/ui/*` components and customize them only where necessary to match the RosterPoint design system.

4. The Tooltip component was installed and recommends `TooltipProvider`. Include checking/updating the appropriate root layout if tooltips are actually used.

5. Keep the existing authentication architecture and requirements from README.md. Do not rewrite the entire plan unnecessarily; update only the affected sections.

6. For the database plan, make RLS policies explicit and ensure users cannot arbitrarily modify their own role. Validate the role server-side/database-side rather than trusting client-provided metadata for authorization.

7. Ensure the password recovery flow includes the proper Supabase recovery-session handling before allowing the password to be changed.

8. Ensure the email confirmation callback safely exchanges the confirmation code and does not allow arbitrary external redirects.

9. Make the middleware plan explicitly distinguish public authentication routes from protected application routes and handle authenticated users visiting `/login` or `/signup`.

10. Keep the instruction that Docker/Supabase/application runtime must NOT be run yet.

11. Keep the final verification and reporting requirements, but clearly distinguish implementation from runtime testing.

Update the current implementation plan in place. Do not start implementing anything yet.


NEW PLAN :
# Implement Supabase Authentication Flow

This document details the plan to implement a complete, robust authentication flow for RosterPoint, adhering strictly to the "premium, minimal" design aesthetic and the database requirements specified.

## User Review Required

- **Roles & Sign Up Strategy**: Users will select their role (`recruiter` or `interviewer`) during sign up. The sign-up form will include a role selector. The database trigger will strictly validate this metadata to ensure it is exactly 'recruiter' or 'interviewer'. Authorization will rely on the `profiles` table row + RLS policies, not merely the client-provided metadata.
- **UI Components**: `shadcn/ui` is already installed and configured. I will reuse the existing `components/ui/*` components and customize them only where necessary to match the RosterPoint design system (subtle borders, clean surfaces, robust typography).

## Open Questions

None currently. The requirements from `README.md` and `ui-enhancement.md` are clear.

## Proposed Changes

---

### Database / Migrations

The roles need to be enforced at the server level. We'll introduce a `profiles` table to track this alongside the auth users, with explicit RLS policies to prevent role tampering.

#### [NEW] `supabase/migrations/20260831000000_auth_roles.sql`
- Create an enum `user_role` (`recruiter`, `interviewer`).
- Create a `public.profiles` table linking to `auth.users` with the role.
- Enable RLS on `public.profiles`.
- **Explicit RLS Policies**:
  - `select`: Users can read their own profile (`auth.uid() = id`).
  - `update`: Users cannot update their own `role`. (Role is read-only for the user after creation).
- **Trigger**: Create a trigger on `auth.users` to automatically populate `public.profiles` when a user signs up. The trigger will validate `raw_user_meta_data->>'role'` to ensure it is exactly 'recruiter' or 'interviewer', defaulting safely or rejecting invalid values.

---

### Supabase Actions & Auth Routes

#### [NEW] `app/auth/actions.ts`
- Implement Next.js Server Actions:
  - `signInAction(formData: FormData)`
  - `signUpAction(formData: FormData)`
  - `signOutAction()`
  - `resetPasswordAction(formData: FormData)` (Starts the recovery flow)
  - `updatePasswordAction(formData: FormData)` (Updates the password after the recovery session is established)

#### [NEW] `app/auth/confirm/route.ts`
- Route handler for verifying the email confirmation token and exchanging it for a session.
- **Security**: It will safely exchange the confirmation code and redirect to a known internal route (e.g., `/dashboard` or `/login`), avoiding arbitrary external redirect URLs to prevent open-redirect vulnerabilities.

#### [NEW] `app/auth/callback/route.ts`
- Route handler for the password recovery flow. It will correctly establish the recovery session from Supabase and redirect the user to `/reset-password` so they can securely call `updateUser()`.

#### [MODIFY] `lib/middleware.ts` / [NEW] `middleware.ts`
- Explicitly define **public routes** (e.g., `/`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth/confirm`, `/auth/callback`) and **protected routes** (everything else, like `/dashboard`).
- If an unauthenticated user visits a protected route, redirect to `/login`.
- **Authenticated-user redirect**: If a user already has a valid session and visits `/login` or `/signup`, intercept and redirect them appropriately to the dashboard rather than showing the auth form again.

---

### Authentication UI & Pages

All UI will be highly minimal, Apple-like, and refined, reusing the existing `shadcn/ui` components.

#### [MODIFY] `app/layout.tsx`
- Ensure `TooltipProvider` wraps the application if tooltips are used anywhere in the auth or layout components.

#### [NEW] `app/(auth)/layout.tsx`
- A minimal centered layout for all auth pages with the RosterPoint logo.

#### [NEW] `app/(auth)/login/page.tsx`
- Login form handling email/password and displaying appropriate loading/error states. Uses existing `Card`, `Input`, `Label`, `Button`.

#### [NEW] `app/(auth)/signup/page.tsx`
- Sign-up form including Email, Password, and a Role selector (Recruiter vs. Interviewer). Uses existing `Select` or `RadioGroup` for the role.

#### [NEW] `app/(auth)/forgot-password/page.tsx`
- Form for requesting a password reset link.

#### [NEW] `app/(auth)/reset-password/page.tsx`
- Form to set a new password, navigated to after clicking the email link.

---

### App Entry Points

#### [MODIFY] `app/page.tsx`
- Update the "Log in" and "Get Started" placeholders to navigate to `/login` and `/signup` respectively.

## Verification Plan

*(Note: Docker/Supabase/application runtime must NOT be run during this implementation phase.)*

### Automated Tests
- N/A for this stage.

### Manual Verification
Once Docker/Supabase is available in the future, the following must be tested manually:
1. Running migrations using `supabase db push` or similar.
2. Sign up flow for both a Recruiter and Interviewer, verifying the trigger correctly assigns the role and rejects invalid metadata.
3. Login flow with valid/invalid credentials.
4. Logging out.
5. Attempting to access protected routes without a session (verifying redirect to `/login`).
6. Attempting to access `/login` or `/signup` with an active session (verifying redirect to `/dashboard`).
7. Email confirmation callback, ensuring no open-redirects.
8. Forgot password flow, ensuring the recovery callback correctly establishes the session before allowing the password update.



Correction :
The updated plan looks good. Make these final corrections before implementation:

1. Profile creation must NOT be client-accessible.
   The `profiles` table should not have a public INSERT policy. Profiles should be created only by the secure database trigger/function associated with `auth.users`.

2. Invalid roles must be rejected, never silently defaulted.
   The signup/profile trigger must accept only exactly `recruiter` or `interviewer`. Any missing or invalid role should fail safely rather than assigning an unintended role.

3. Make the RLS policy design explicit:
   - Users can SELECT only their own profile.
   - Users must not be able to INSERT profiles.
   - Users must not be able to change their role.
   - Any UPDATE policy must prevent role modification, or omit UPDATE entirely if profile updates are not currently required.
   - Follow the README requirements for any additional profile fields.


4. Keep the current plan structure and update only these details. Do not implement yet.



Add Google OAuth authentication to the existing Supabase authentication implementation.

I have ALREADY configured Google OAuth in Supabase and Google Cloud, including the required credentials, redirect URLs, and provider settings. Do not change or recreate any of that configuration.

Update the existing authentication implementation to support:

- "Continue with Google" on the Login page.
- "Continue with Google" on the Signup page.
- Use Supabase Auth's Google OAuth provider.
- Implement the OAuth flow using the existing Supabase browser/server client architecture.
- Add or update the required OAuth callback route.
- Correctly exchange the OAuth authorization code for a Supabase session.
- Preserve the existing RosterPoint authentication flow and middleware.
- After successful Google authentication, redirect the user to the appropriate authenticated destination.
- Handle OAuth cancellation, errors, invalid callbacks, and failed authentication gracefully.
- Ensure the session is correctly persisted and recognized by middleware/server components.
- Do not create a separate authentication system.

IMPORTANT ROLE HANDLING:
Google users still need a RosterPoint role (`recruiter` or `interviewer`) because the existing authorization model requires it.

Do NOT automatically invent or assign a role to Google users.

If a Google-authenticated user does not yet have a `profiles` record/role:
- Redirect them to an appropriate onboarding/role-selection step.
- Let them select `recruiter` or `interviewer`.
- Create/update the profile securely using the existing server-side authorization model.
- Do not allow the client to arbitrarily assign or modify roles.
- Existing users with a valid profile should proceed directly to the authenticated application.

UI:
- Add a polished "Continue with Google" button using the existing shadcn/ui components.
- Keep it compact, sleek, and consistent with the RosterPoint design system.
- Use the official Google visual treatment appropriately without making the button visually dominant.
- Maintain the same premium, minimal, Apple-like authentication aesthetic.
- Include a subtle divider such as "OR" only if it improves the layout.

Before implementation:
- Inspect the current authentication implementation and existing `/auth/callback` route.
- Reuse the existing callback architecture where possible instead of creating conflicting routes.
- Inspect the existing profiles/role logic before modifying it.
- Follow README.md and ui-enhancement.md strictly.

Do NOT run Docker, Supabase, migrations, or the application.

If database changes are genuinely required, add them as proper migration files under the existing `supabase/migrations` directory.

After implementation, report:
1. What was changed.
2. Why it was changed.
3. Files created/modified.
4. How the Google OAuth flow works.
5. How Google users without a RosterPoint role are handled.
6. Any SQL/migrations added.
7. What still needs runtime testing once Docker/Supabase is available.



Correction :
Review the plan again and make these architectural corrections before implementation:

1. Do NOT use SUPABASE_SERVICE_ROLE_KEY / the Supabase Admin Client for normal user onboarding unless the existing architecture genuinely requires it. Prefer the authenticated server-side Supabase client and a narrowly scoped secure database operation/RPC for creating the user's own profile. Avoid unnecessary service-role privileges.

2. `/onboarding` must NOT be treated as a truly public route.
   It should require an authenticated Supabase session, but users who are authenticated and do not yet have a profile must be allowed to access it.

3. Middleware behavior should be:
   - Unauthenticated + protected route → `/login`
   - Authenticated + no profile + protected application route → `/onboarding`
   - Authenticated + no profile + `/onboarding` → allowed
   - Authenticated + existing profile + `/onboarding` → redirect to the appropriate authenticated destination
   - Authenticated + existing profile + protected route → allowed

4. Role selection must be one-time and server-authorized.
   A user who already has a profile must not be able to revisit onboarding and change their role.

5. Enforce the profile relationship at the database level:
   - `profiles.id` should uniquely correspond to `auth.users.id`
   - A user must have at most one profile
   - The selected role must be strictly `recruiter` or `interviewer`
   - Do not expose a general client-side mechanism for arbitrary role assignment or role modification.

6. Make the onboarding profile creation operation atomic and secure. Prefer a narrowly scoped database function/RPC or another server-authorized mechanism over a broadly privileged service-role client.

7. Keep the existing `handle_new_user` behavior:
   - Valid role metadata → create the profile.
   - Missing role → allow the auth user to exist without a profile so Google OAuth can continue to onboarding.
   - Invalid role → reject rather than defaulting.

8. Reuse the existing `/auth/callback` architecture for Google OAuth where possible. Do not create competing callback flows.

9. Keep `supabase.auth.getUser()` for server-side authentication validation rather than relying on untrusted client state.

10. The Google icon can be implemented as an inline SVG. Do not add an unnecessary dependency for it.

11. Keep the existing RosterPoint design system and shadcn/ui components. The Google button should be compact, polished, and visually consistent with the rest of the authentication UI.

Update the existing plan only. Do not implement anything yet.