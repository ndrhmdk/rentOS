<!-- rentos-backlog-v2: RNT-01 -->

# RNT-01: Set up database, Sanctum, Telescope, API docs, seed data and CI/test rules

## Outcome

Khai alone delivers the shared reproducible Laravel/Next.js/Supabase foundation, all initial migrations/seeds, LLM rules, CI/CD and future TypeScript setup documentation. This includes initial Sanctum, Scramble and Telescope installation/configuration.

## Ownership and order

- Phase 1: Shared setup, accounts, properties and admin approval
- Implementation: **Khai** (frontend + backend + own tests).
- Reviewer: **Kien**.
- Prerequisites for final integration: None.
- Publication: Draft; delivery: Planned; actual GitHub URL: https://github.com/ndrhmdk/rentOS/issues/97.

A prerequisite gates closure/integration, not all early work: use agreed contracts, factories and local fixtures after the shared schema/auth checkpoint. This is one grouped issue; internal checklists/multiple PRs do not require extra micro-issues.

## Functional requirements

- **FR44 — OpenAPI documentation** (P1 Should): Document Supabase bearer identity verification at token issuance separately from Sanctum bearer authentication on private product endpoints, including abilities, expiry/revocation and 401/403. Document payloads, responses, UUIDs, revisions and idempotency.
  - Full cases: [FR44 (3 cases)](../../docs/06-acceptance/test-scenarios.md#fr44)
- **FR74 — Idempotent writes and stale revisions** (P0 Must): Use client_operation_id UUID on creates and revision checks on mutable resources. Scope operation key to actor/parent. Reusing key with different canonical payload returns409; terminal action replay never repeats side effects.
  - Full cases: [FR74 (4 cases)](../../docs/06-acceptance/test-scenarios.md#fr74)
- **FR75 — Transactional locking audit and consistency** (P0 Must): All writes use shared Laravel actions, fixed lock order property then units sorted by UUID then rental request/tenancy/renewal rows. Persist domain/audit/outbox/idempotency in same transaction. Direct clients cannot write application tables. Cross-table invariants use composite FKs and deferred constraint triggers as specified.
  - Full cases: [FR75 (4 cases)](../../docs/06-acceptance/test-scenarios.md#fr75)
- **FR76 — Deferred and excluded MVP scope** (P3 Exclude): No phone OTP, property/image moderation, image replacement review, in-app viewing calendar, platform e-signature engine, payment collection, mid-term confirmed-contract amendment, Kafka/RabbitMQ, Elasticsearch or custom thumbnail AI in initial MVP. Supabase Auth email confirmation remains. Maps/Google sign-in/property reviews retain separately marked deferred priorities.
  - Full cases: [FR76 (3 cases)](../../docs/06-acceptance/test-scenarios.md#fr76)

## Backend deliverables

- [ ] Bootstrap an unexposed laravel schema BEFORE Laravel migration history; configure direct PostgreSQL connection for migrations, local/hosted environment templates, SSL and separate deploy/runtime credentials. Use the direct endpoint only when the runner has connectivity; document an explicit session-pooler fallback if IPv6/IPv4 constraints prevent it. Do not silently use transaction pooling for migrations.
- [ ] Create ALL approved MVP domain/support tables from the data dictionary, including favourite_properties, property_media, audit_logs, notification_outbox, notifications and idempotency_records, plus required Laravel internal tables. auth.users is provider-managed; optional P2 property_reviews stays deferred. Add UUID/composite FKs, partial uniqueness, GiST exclusion, immutable-contract/write-once confirmation triggers and commit invariants.
- [ ] Create deterministic seeders/factories for owner, tenant and admin roles plus properties and units, moderation, reports, rental requests, contract/renewal and favourite examples. Use local Auth fixtures compatible with provider-managed auth.users. Never reseed hosted production.
- [ ] Publish shared schema, API error/pagination conventions and revision/idempotency/lock-order helpers early. Configure required Scramble API documentation for Laravel Resources/FormRequests; this is distinct from future TypeScript generator setup.
- [ ] Write AGENTS.md: coding conventions, allowed architecture, unit/component/API integration expectations; no automated browser suite required, real PostgreSQL concurrency tests, migration safety and the exact checks AI must pass before reporting completion.
- [ ] Own CI/CD configuration: PR lint/static/type/build and frontend/backend tests against disposable PostgreSQL/Supabase; reviewed main merges deploy matching code and serialized migrations after checks pass. Separate PR/deploy credentials, protect secrets, and provide worker/scheduler, failure and restore guidance.
- [ ] Write TYPESCRIPT_STRATEGY.md only for future Resources/FormRequests -> OpenAPI -> TypeScript setup. Include rationale, prerequisites, proposed commands, inference limits, maintenance and future CI drift checking. Do not install/configure/run the TypeScript generator or require generated artifacts in this issue.
- [ ] Requirement mapping: FR44 sets up API documentation; each endpoint owner maintains their documentation. FR74/FR75 establish shared retry, revision, transaction, audit and database safeguards here; every state-changing feature must apply and test them. FR76 is the written list of excluded MVP features, not an implementation deliverable.
- [ ] Install/configure Laravel Sanctum as shared infrastructure and add its personal_access_tokens migration to the unexposed application schema. Use a UUID-compatible tokenable_id matching the user_profiles Auth UUID; keep token hashes, abilities and expiry. Configure the Authenticatable profile model/provider with HasApiTokens. Supabase remains the only password store. Hien owns token issuance, routes and lifecycle in RNT-03.
- [ ] Install a Laravel-compatible Telescope version, publish its provider/config/assets/migrations and configure storage on the private Laravel schema/connection. Enable request, exception, query and job watchers needed for development; configure query thresholds, filtering and scheduled telescope:prune retention. Document reproducible installation and environment settings.
- [ ] Use Telescope locally for developers; keep shared/deployed access disabled by default. If enabled outside local, require a tested authentication/access-control path and restricted viewTelescope gate. Browser navigation does not automatically send the frontend Sanctum bearer token. Never expose a deployed APP_ENV=local dashboard. Hide bearer/cookie/password/recovery credentials and filter sensitive request/query/job data, contacts and contract contents.

## Frontend deliverables

- [ ] Establish the supported Next.js app, design tokens, typed fetch client, TanStack Query providers and common error/loading/empty components while preserving implemented UI/assets.
- [ ] Provide one shared API client boundary with explicit maintained TypeScript response types, safe error handling and frontend test configuration. Document future replacement by generated types without requiring generation now. Account screens and Sanctum/JWT identity integration belong to Hien in RNT-03.

## Acceptance criteria

- [ ] A fresh local Supabase environment builds the complete MVP schema and deterministic representative seeds from committed scripts.
- [ ] PostgreSQL independently rejects overlapping blocked periods, inconsistent references and term/document mutation; adjacent periods are allowed and first legitimate confirmation metadata writes are allowed.
- [ ] The browser cannot bypass Laravel through unintended Data API grants or access a private bucket; auth.users FKs resolve in local and CI setups.
- [ ] All four teammates can pull the checkpoint and run migrations locally; configuration does not pretend search_path creates/moves existing tables.
- [ ] A single owner, Khai, delivers migrations/seeds, connection instructions, coding/LLM rules, CI/CD and TypeScript setup documentation in this grouped issue.
- [ ] PR CI fails on deliberate backend/frontend test and lint/typecheck errors; failed checks or migrations block hosted deployment. Main deployment is serialized and never resets/reseeds production.
- [ ] AGENTS.md names required checks and per-feature tests; another member reproduces local setup using documented commands.
- [ ] TypeScript strategy documents future setup accurately; acceptance requires no installed TS generator, generated types or generated-file drift gate. Existing frontend typecheck/build and actual response tests remain required.
- [ ] Closing RNT-01 proves shared safeguards and setup only. It does not claim all feature-specific FR74/FR75 scenarios are complete; those belong to the feature owners. FR76 is recorded as a project scope rule.
- [ ] Fresh and upgrade migrations create Sanctum token storage compatible with UUID profile IDs. API tokens and their hashes are not exposed through the Supabase Data API or logs; local/CI token fixtures support ability/expiry/revocation tests.
- [ ] A teammate follows setup instructions and sees a controlled local request, exception, query and queued-job record in Telescope. Scheduled pruning removes expired diagnostic entries without touching business audit/history data.
- [ ] Shared/deployed Telescope access is disabled or explicitly restricted; guest/ordinary-user access is denied in non-local tests. Representative captured entries contain no Sanctum/Supabase tokens, passwords, private contacts or contract payloads.

## Tests/evidence owned by this member

- [ ] Real PostgreSQL integration tests for migration rebuild/upgrade, constraints, concurrent overlap/uniqueness and rollback invariants.
- [ ] Configuration/client component tests for shared error handling; smoke-test the frontend/backend scaffold without transferring feature tests from their owners.
- [ ] Exercise CI intentional-failure blocking and disposable migration/seed rebuild; record actual results and direct-connection preflight. Verify setup docs by a teammate walkthrough.
- [ ] Configuration/integration tests for Telescope migration/storage, environment enable/disable, non-local access denial, filtering/redaction and scheduled pruning; record a short manual local-dashboard verification. No E2E suite required.

## NFRs, boundaries and coordination

NFR-02, NFR-03, NFR-06, NFR-07, NFR-05; T1a, T1b, T1c, T1d, T3a, T3g, T4c, T4d, T2a, T2b, T3c, T4b, T5a
Khai is the sole initial shared-setup owner. Kien reviews. Other members consume the early schema/convention checkpoint and own their complete feature slices/tests; later feature schema changes use reviewed additive migrations. Hien owns authentication/profile implementation. RNT-13 tests and improves Khai’s pipeline rather than assigning setup to another member. Future TypeScript generation is documentation only. Khai owns initial Telescope configuration (T5a). Tri uses that setup for diagnostics, correlation and real alert delivery in RNT-12; Telescope itself is not the alert-delivery implementation.

## Definition of done

- [ ] Implement the related frontend, backend and meaningful unit/component/API integration tests under this issue; test PostgreSQL constraints/concurrency on actual PostgreSQL.
- [ ] Private product routes require auth:sanctum, approved abilities and resource Policies. Test actual bearer expiry/revocation/permission behavior where relevant.
- [ ] Update FormRequests/Resources/API docs and explicit frontend response types with contract changes. Future TypeScript generation is documentation only.
- [ ] Apply shared transaction/revision/idempotency/audit rules to the affected actions. Schema changes are new reviewed migrations tested locally; never reset/reseed a hosted environment.
- [ ] Use a short manual checklist for changed screens; automated browser/E2E suites are not required.
- [ ] Attach actual test commands/results and relevant screenshots/provider/query/alert evidence; record personal sprint contribution. A document or fixture screenshot is not proof of implemented behavior.

RNT-01 is a planning key, not a GitHub issue number. Deleted issues are not reused.
