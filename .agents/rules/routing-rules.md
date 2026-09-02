# Routing Rules

- **Do NOT use `app/(recruiter)` for routes.** 
- All recruiter dashboard routes and pages MUST be placed in `app/recruiter/`.
- Creating `app/(recruiter)` alongside `app/recruiter` causes duplicate routing conflicts and blank pages when accessing paths like `/recruiter/alerts` or `/recruiter/interview-panel`.
- Always verify you are working in `app/recruiter` when dealing with the Recruiter dashboard.
