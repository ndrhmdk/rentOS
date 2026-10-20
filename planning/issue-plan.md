# Issue plan

Implementable issues only. Epics below are groupings, not extra GitHub issues and not duplicate checklists.

## Critical path
Supabase wiring and profiles → inventory schema and exclusion constraint → JWT and policies → property, unit, media, listing draft → first review and publish → public search → enquiry → proposal and exact-version confirmation → renewal hold and scheduled expiry → reports and suspension → coverage, monitoring, README, and demo.

Favourites branch after profiles, properties, and the visibility rule, without waiting for renewals. Admin screens can start on typed fixtures after the Next.js shell exists. They are done only when they call the reviewed admin endpoints.

## Epics
- Platform and evidence: RENT-001–RENT-005
- Identity: RENT-006–RENT-017
- Inventory: RENT-018–RENT-029
- Listing review and publication: RENT-030–RENT-038
- Discovery and favourites: RENT-039–RENT-043
- Enquiries and tenancies: RENT-044–RENT-055
- Renewals: RENT-056–RENT-058
- Reports and admin UI: RENT-059–RENT-066
- Operations and submission: RENT-067–RENT-086

## Tentative load
Estimates are developer-days for sequencing. They are not a claim that five weeks remain, and they are not a sprint commitment.

| Alias | Issues | Tentative days | Role |
| --- | --- | --- | --- |
| A | 29 | 34.0 | Identity, schema races, tenancy, jobs, monitoring, CI |
| B | 26 | 29.5 | Inventory, storage, listing actions, search, reports backend |
| C | 20 | 19.0 | Next.js tenant and owner flows, favourites, UI coverage |
| D | 11 | 5.5 | Admin queue, detail, reason forms, fixtures, UI tests, screenshots |

Member A is the critical path because reservation, confirmation, and course operations sit there. Member B reviews that work and owns the owner-domain backend. The day totals are not balanced to equal issue counts. Member D stays on bounded admin UI so authorization and SQL locks are not assigned as beginner tasks. After real handles and capacity are known, the team can move pairing, not the privilege boundary.

## Ordered issues
| ID | Title | Owner | Reviewer | Risk | Days | Depends on |
| --- | --- | --- | --- | --- | --- | --- |
| RENT-001 | Record lecturer evidence for Next.js and JWT substitutions | A | B | high | 0.5 | — |
| RENT-003 | Add issue-linked branches, pull requests, and CI | A | B | medium | 1 | — |
| RENT-004 | Create the Next.js frontend shell | C | A | medium | 1 | — |
| RENT-005 | Wire Laravel to Supabase Postgres, Auth, and Storage | A | B | high | 1 | — |
| RENT-082 | File Member A sprint self-reports | A | B | low | 0.5 | — |
| RENT-083 | File Member B sprint self-reports | B | A | low | 0.5 | — |
| RENT-084 | File Member C sprint self-reports | C | A | low | 0.5 | — |
| RENT-085 | File Member D sprint self-reports | D | B | low | 0.5 | — |
| RENT-006 | Add user_profiles keyed to Supabase Auth | A | B | high | 1 | RENT-005 |
| RENT-067 | Bootstrap the queue worker and scheduler | A | B | medium | 1 | RENT-005 |
| RENT-072 | Install Telescope for restricted diagnostics | A | B | medium | 0.5 | RENT-005 |
| RENT-073 | Log errors and send a critical alert | A | B | medium | 1 | RENT-005 |
| RENT-075 | Monitor CPU, memory, disk, and network | A | B | medium | 1 | RENT-005 |
| RENT-007 | Migrate properties, units, media, and listings | B | A | high | 2 | RENT-006 |
| RENT-012 | Verify Supabase JWTs in Laravel | A | B | high | 2 | RENT-005, RENT-006 |
| RENT-008 | Migrate enquiries, tenancies, contracts, and exclusion | A | B | high | 2 | RENT-007 |
| RENT-009 | Migrate reports, audit logs, notifications, and outbox | B | A | medium | 1 | RENT-006, RENT-007 |
| RENT-010 | Migrate favourite_properties | B | A | medium | 0.5 | RENT-006, RENT-007 |
| RENT-002 | Agree the CSRF demonstration for bearer authentication | A | B | high | 0.5 | RENT-012 |
| RENT-013 | Bootstrap and update the signed-in profile | A | B | medium | 1 | RENT-012 |
| RENT-011 | Seed public, hidden, suspended, and saved scenarios | B | A | medium | 1 | RENT-007, RENT-008, RENT-009, RENT-010 |
| RENT-014 | Build registration, login, logout, and reset screens | C | A | medium | 1 | RENT-004, RENT-013 |
| RENT-016 | Enforce resource and admin policies | A | B | high | 1 | RENT-013 |
| RENT-015 | Add tenant and owner dashboard shells | C | A | low | 0.5 | RENT-014 |
| RENT-017 | Add idempotency keys, revisions, and the error schema | A | B | high | 1 | RENT-016 |
| RENT-035 | Build the admin first-review queue | D | B | low | 0.5 | RENT-004, RENT-015 |
| RENT-062 | Build the admin report queue | D | A | low | 0.5 | RENT-004, RENT-015 |
| RENT-018 | Add owner property create, update, and archive | B | A | medium | 1 | RENT-007, RENT-017 |
| RENT-036 | Build the admin first-review detail | D | B | low | 0.5 | RENT-035 |
| RENT-063 | Build the admin report detail | D | A | low | 0.5 | RENT-062 |
| RENT-019 | Build property create and edit screens | C | B | low | 1 | RENT-015, RENT-018 |
| RENT-020 | Add unit create, bulk create, edit, and operational status | B | A | high | 1.5 | RENT-018 |
| RENT-030 | Create and edit the property listing draft | B | A | medium | 1 | RENT-018 |
| RENT-071 | Generate OpenAPI with Scramble | A | B | medium | 1 | RENT-012, RENT-018 |
| RENT-021 | Build unit management screens | C | B | low | 1 | RENT-019, RENT-020 |
| RENT-022 | Store property and unit photos in Supabase Storage | B | A | high | 1.5 | RENT-005, RENT-020 |
| RENT-026 | Edit controlled property and unit policies | B | A | medium | 1 | RENT-020 |
| RENT-027 | Manage standard and custom amenities | B | A | medium | 1.5 | RENT-020 |
| RENT-080 | Replace the root README with the submission overview | A | C | medium | 1 | RENT-011, RENT-071 |
| RENT-023 | Select, reorder, and remove gallery images | B | A | medium | 1 | RENT-022 |
| RENT-028 | Build policy and amenity editing screens | C | B | low | 1 | RENT-021, RENT-026, RENT-027 |
| RENT-029 | Audit property, unit, and policy changes | B | A | medium | 1 | RENT-009, RENT-018, RENT-020, RENT-026, RENT-027 |
| RENT-024 | Build the owner gallery screen | C | B | low | 0.5 | RENT-021, RENT-023 |
| RENT-025 | Clean orphaned and deleted media safely | B | A | medium | 0.5 | RENT-023, RENT-067 |
| RENT-031 | Submit the initial listing package | B | A | high | 1 | RENT-030, RENT-023, RENT-026, RENT-027 |
| RENT-032 | Approve or reject the initial listing package | B | A | high | 1.5 | RENT-031, RENT-016 |
| RENT-033 | Publish, hide, and archive a listing | B | A | high | 1 | RENT-032 |
| RENT-037 | Build admin approve and reject reason forms | D | A | medium | 0.5 | RENT-036, RENT-032 |
| RENT-034 | Build the owner listing draft, submit, and publish flow | C | B | medium | 1 | RENT-024, RENT-028, RENT-030, RENT-031, RENT-033 |
| RENT-039 | Search published listings by the full date interval | B | A | high | 2 | RENT-033, RENT-008, RENT-027 |
| RENT-042 | Save and remove favourite properties | B | A | high | 1 | RENT-010, RENT-016, RENT-033 |
| RENT-044 | Submit and withdraw a rental enquiry | A | B | high | 1 | RENT-017, RENT-008, RENT-033 |
| RENT-059 | Accept listing reports and show reporter outcomes | B | A | high | 1 | RENT-016, RENT-009, RENT-033 |
| RENT-038 | Cover the first-review screens with UI tests | D | B | low | 0.5 | RENT-035, RENT-036, RENT-037 |
| RENT-040 | Build listing search and detail pages | C | B | medium | 1.5 | RENT-004, RENT-039 |
| RENT-041 | Cache public listings and keep private data uncached | C | B | high | 1 | RENT-039, RENT-033 |
| RENT-074 | Alert when a query exceeds the slow-query threshold | A | B | medium | 1 | RENT-072, RENT-039 |
| RENT-046 | Give owners an enquiry inbox and reject action | A | B | high | 1 | RENT-044 |
| RENT-055 | Reject aged enquiries only when the interval is unavailable | B | A | high | 1.5 | RENT-044, RENT-039, RENT-067 |
| RENT-061 | Resolve reports and suspend or restore listings | B | A | high | 1.5 | RENT-059, RENT-033 |
| RENT-043 | Build favourite hearts and the saved list | C | B | medium | 1 | RENT-014, RENT-040, RENT-042 |
| RENT-045 | Build the enquiry form and tenant request list | C | A | medium | 1 | RENT-040, RENT-044 |
| RENT-060 | Build the listing report form and reporter list | C | B | low | 0.5 | RENT-040, RENT-059 |
| RENT-078 | Record frontend resource-loading improvements | C | B | medium | 1 | RENT-040, RENT-024 |
| RENT-047 | Build the owner enquiry inbox | C | A | low | 0.5 | RENT-015, RENT-046 |
| RENT-048 | Commit a tenancy proposal and temporary hold | A | B | high | 2 | RENT-046, RENT-026, RENT-017 |
| RENT-064 | Build admin report decision forms | D | A | medium | 0.5 | RENT-063, RENT-061 |
| RENT-065 | Build the admin suspend and restore form | D | A | medium | 0.5 | RENT-063, RENT-061 |
| RENT-049 | Confirm or decline the exact contract version | A | B | high | 2 | RENT-048 |
| RENT-050 | Download the private contract document | B | A | high | 1 | RENT-022, RENT-048 |
| RENT-054 | Expire confirmation holds on a schedule | A | B | high | 1 | RENT-048, RENT-067 |
| RENT-068 | Deliver domain notifications through the outbox | B | A | high | 1.5 | RENT-009, RENT-067, RENT-048 |
| RENT-076 | Raise API test coverage above 70 percent | A | B | high | 2 | RENT-048, RENT-039, RENT-061, RENT-012 |
| RENT-079 | Remove listing and tenancy query antipatterns | B | A | medium | 1 | RENT-039, RENT-048 |
| RENT-066 | Cover admin report screens with UI tests | D | A | low | 0.5 | RENT-062, RENT-063, RENT-064, RENT-065 |
| RENT-052 | Record move-in, cancellation, and tenancy end | A | B | high | 1.5 | RENT-049 |
| RENT-053 | Submit a corrected unconfirmed contract | A | B | high | 1.5 | RENT-049 |
| RENT-051 | Build the tenancy timeline and confirmation screen | C | A | medium | 1.5 | RENT-049, RENT-050 |
| RENT-081 | Produce the course demo recording | A | C | medium | 1 | RENT-080, RENT-075, RENT-074, RENT-054 |
| RENT-069 | Expose the private notification inbox API | B | A | medium | 0.5 | RENT-068 |
| RENT-086 | Add admin screenshots and accessibility notes | D | C | low | 0.5 | RENT-038, RENT-066, RENT-080 |
| RENT-056 | Submit, withdraw, or reject a renewal request | A | B | high | 1 | RENT-052 |
| RENT-077 | Raise UI and business coverage above 70 percent | C | A | high | 2 | RENT-043, RENT-045, RENT-051, RENT-038, RENT-066 |
| RENT-070 | Build the notification inbox screen | C | B | low | 0.5 | RENT-069, RENT-014 |
| RENT-057 | Propose a renewal segment without releasing occupancy | A | B | high | 2 | RENT-056, RENT-048 |
| RENT-058 | Build renewal request and proposal screens | C | A | medium | 1 | RENT-051, RENT-056, RENT-057 |

## Reuse
There were no existing GitHub issues or pull requests to link. The Laravel skeleton, Sanctum install, jobs migration, pull request template, and `design/` tokens are reused. The Vite apps are not extended into the product UI.

