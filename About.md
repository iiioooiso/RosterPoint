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


