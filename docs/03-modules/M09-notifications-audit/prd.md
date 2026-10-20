# M09 Product requirements

## Purpose
Transactional outbox, private in-app inbox where supported, event deduplication and after-commit worker delivery.

## Actors and permissions
Use actor/resource Policies from each FR below; UI guards never replace backend checks.

## Functional requirements

### FR45 Asynchronous domain notifications
Priority: P1 Should. Actors: System. Dependencies: Shared identity/resource foundation.

Factors: After-commit reliability; retry semantics

Tools: Laravel Queue(database) + Workers + Scheduler + transactional outbox + Supabase PostgreSQL

Write notification_outbox atomically with request/moderation/proposal/confirmation/renewal outcomes. Laravel queue workers deliver notifications after commit, with retry/event deduplication. Use database-backed Laravel Queue on Supabase PostgreSQL for MVP; no Kafka/RabbitMQ or viewing reminders.

Acceptance criteria:

- FR45-AC01 [Positive] Owner creates proposal → Tenant notification links exact version/deadline after commit.
- FR45-AC02 [Failure] Delivery service unavailable → Business transaction remains committed; bounded worker retries and observable failure.
- FR45-AC03 [Race] Worker repeats event → Recipient inbox event uniqueness prevents duplicate inbox items.
- FR45-AC04 [Integrity] Proposal replaced before delayed notice delivered → Notice points to historical version and current UI flags superseded; no stale confirm action allowed.

### FR73 Private notification inbox
Priority: P1 Should. Actors: User. Dependencies: FR45.

Factors: Recipient isolation; idempotent read state

Tools: Next.js + React + Tailwind + TanStack Query + Laravel REST + FormRequest + Policies + Eloquent + Supabase PostgreSQL + notifications

Persist event-keyed in-app messages with safe links; unread/read state per recipient. Email links navigate through authorized application routes, not permanent document URLs.

Acceptance criteria:

- FR73-AC01 [Positive] User marks own notification read twice → Idempotent read_at; no duplicate rows.
- FR73-AC02 [Security] Other user reads/marks it → 403/404.
- FR73-AC03 [Race] Same event delivered twice → Unique recipient/event_key yields one notification.

## Data and API boundary
Use the shared data dictionary and versioned API contract; do not invent tables/enums to suit one screen. Every issue identifies exact routes, schema fields, stale-state behavior and cache invalidation that it changes.

## Failure and concurrency
No rolled-back success notice, private links, retry leases and worker duplicate safety. Ordinary permission/validation/empty/network states are part of completion, alongside the specific race cases above. PostgreSQL invariants require real database tests.

## Definition of done
UI and API integrated where applicable; unit and integration tests; private/public DTO checks; Scramble and source docs synchronized; audit/outbox only where required; issue-linked PR and reviewer evidence. No implementation is claimed here.

## Out of scope
No viewing reminders; logs/outbox remain distinct from notifications; real email transport optional unless chosen for external-API evidence.
