# M10 Product requirements

## Purpose
Git workflow, CI, migrations/seeds, Scramble, unit/integration coverage, logging/alerts, server metrics, resource loading, cache and demo/report evidence.

## Actors and permissions
Use actor/resource Policies from each FR below; UI guards never replace backend checks.

## Functional requirements

### FR44 OpenAPI documentation
Priority: P1 Should. Actors: Developer. Dependencies: FR40 FR41 FR42 FR43.

Factors: Usable API contract

Tools: Scramble/OpenAPI + Laravel middleware annotation

Document endpoints, payloads, responses, UUIDs, expected revisions, idempotency and Supabase bearer security. Do not label JWT as Sanctum token.

Acceptance criteria:

- FR44-AC01 [Positive] Open generated docs → Auth and action routes include examples for401/403/404/409/422.
- FR44-AC02 [Validation] Try documented request flow → Matches implemented field names and state enums.
- FR44-AC03 [Security] Published specification → No secrets or live private document URLs.

### FR47 Structured logs and critical alerts
Priority: P1 Should. Actors: System; Developer. Dependencies: Shared identity/resource foundation.

Factors: Traceability; privacy

Tools: Laravel Logging/Monolog + configured alert destination

Log request/event ID, actor/resource UUIDs, operation and failure duration/context. Alert configured admin/developer on critical storage, transaction or exhausted job failures. Business audit remains separate.

Acceptance criteria:

- FR47-AC01 [Failure] Simulate storage or exhausted notification failure → Useful structured log with correlation ID; critical alert emitted with deduplication.
- FR47-AC02 [Security] Inspect log payload → No passwords, access/refresh tokens, full contracts or signed URLs.
- FR47-AC03 [Integrity] Notification provider fails while alerting → Log fallback; do not roll back completed business action.

### FR48 Development monitoring and slow query alerts
Priority: P1 Should. Actors: Developer; authorized admin. Dependencies: Shared identity/resource foundation.

Factors: Performance; restricted diagnostics

Tools: Laravel Telescope + DB query listener + cumulative query monitoring

Use Telescope in development with restricted access. Capture slow query duration and cumulative query time and configure explicit developer alert thresholds; Telescope display alone is not an alert.

Acceptance criteria:

- FR48-AC01 [Positive] Slow query exceeds configured threshold → Record duration/query fingerprint/correlation; deliver alert once per dedupe window.
- FR48-AC02 [Security] Public visitor requests Telescope → Unavailable or403; query bindings redact sensitive information.
- FR48-AC03 [Failure] Monitor/alert service down → App continues; local diagnostic fallback.

### FR76 Deferred and excluded MVP scope
Priority: P3 Exclude. Actors: Team. Dependencies: Shared identity/resource foundation.

Factors: Feasible five-week scope

Tools: No new service

No phone OTP, property/image moderation, image replacement review, in-app viewing calendar, platform e-signature engine, payment collection, mid-term confirmed-contract amendment, Kafka/RabbitMQ, Elasticsearch or custom thumbnail AI in initial MVP. Supabase Auth email confirmation remains. Maps/Google sign-in/property reviews retain separately marked deferred priorities.

Acceptance criteria:

- FR76-AC01 [Integrity] Review MVP screens/API/schema → No mandatory phone verification or removed review/scheduling workflow.
- FR76-AC02 [Integrity] Contract confirmation shown → Describe participant acknowledgement of stored version; do not claim verified legal e-signature.
- FR76-AC03 [Positive] Later extension added → Use explicit requirements/migration rather than reviving removed states implicitly.

## Data and API boundary
Use the shared data dictionary and versioned API contract; do not invent tables/enums to suit one screen. Every issue identifies exact routes, schema fields, stale-state behavior and cache invalidation that it changes.

## Failure and concurrency
Course-required work cannot be dropped just because an earlier product FR had P1 priority. Ordinary permission/validation/empty/network states are part of completion, alongside the specific race cases above. PostgreSQL invariants require real database tests.

## Definition of done
UI and API integrated where applicable; unit and integration tests; private/public DTO checks; Scramble and source docs synchronized; audit/outbox only where required; issue-linked PR and reviewer evidence. No implementation is claimed here.

## Out of scope
No assumed deployment provider, paid tier, installed versions or unapproved stack substitution.
