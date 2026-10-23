<!-- rentos-backlog-v2: RNT-01 -->

# RNT-01: Set up database, Fortify, Sanctum, Telescope, API docs and CI/test rules

## Outcome

Khai delivers all shared initial migrations/seeds, Fortify/Sanctum session and token infrastructure, CSRF/CORS conventions, Scramble/Telescope, CI/CD, LLM/test guidance and future TypeScript setup documentation.

## Ownership and order

- Phase 1.
- Implementation: **Khai** (frontend + backend + own tests).
- Reviewer: **Kien**.
- Prerequisites: None.
- Publication: Draft; actual GitHub issue URL not recorded.

Dependencies gate final integration; fixtures and agreed contracts allow earlier independent work. This remains one grouped issue with internal checklists and multiple PRs if useful.

## Functional requirements

- **FR44 — OpenAPI documentation** (P1 Should): Scramble documents Fortify session/CSRF setup separately from Sanctum bearer tokens, the token-enabled endpoint/ability matrix, session-only routes and 401/403/419/422 failures. Include token creation/list/revocation, expiry, one-time secret response and redaction. Preserve payload, revision and idempotency documentation.
  - [All 3 acceptance cases](../../docs/06-acceptance/test-scenarios.md#fr44)
- **FR74 — Idempotent writes and stale revisions** (P0 Must): Use client_operation_id UUID on creates and revision checks on mutable resources. Scope operation key to actor/parent. Reusing key with different canonical payload returns409; terminal action replay never repeats side effects.
  - [All 4 acceptance cases](../../docs/06-acceptance/test-scenarios.md#fr74)
- **FR75 — Transactional locking audit and consistency** (P0 Must): All writes use shared Laravel actions, fixed lock order property then units sorted by UUID then rental request/tenancy/renewal rows. Persist domain/audit/outbox/idempotency in same transaction. Direct clients cannot write application tables. Cross-table invariants use composite FKs and deferred constraint triggers as specified.
  - [All 4 acceptance cases](../../docs/06-acceptance/test-scenarios.md#fr75)
- **FR76 — Deferred and excluded MVP scope** (P3 Exclude): No phone OTP, property/image moderation, image replacement review, in-app viewing calendar, platform e-signature engine, payment collection, mid-term confirmed-contract amendment, Kafka/RabbitMQ, Elasticsearch or custom thumbnail AI in initial MVP. Laravel email confirmation remains required. Maps/Google sign-in/property reviews retain separately marked deferred priorities.
  - [All 3 acceptance cases](../../docs/06-acceptance/test-scenarios.md#fr76)

## Backend deliverables

- [ ] Bootstrap an unexposed laravel schema BEFORE Laravel migration history; configure direct PostgreSQL connection for migrations, local/hosted environment templates, SSL and separate deploy/runtime credentials. Use the direct endpoint only when the runner has connectivity; document an explicit session-pooler fallback if IPv6/IPv4 constraints prevent it. Do not silently use transaction pooling for migrations.
- [ ] Publish shared schema, API error/pagination conventions and revision/idempotency/lock-order helpers early. Configure required Scramble API documentation for Laravel Resources/FormRequests; this is distinct from future TypeScript generator setup.
- [ ] Write AGENTS.md: coding conventions, allowed architecture, unit/component/API integration expectations; no automated browser suite required, real PostgreSQL concurrency tests, migration safety and the exact checks AI must pass before reporting completion.
- [ ] Own CI/CD configuration: PR lint/static/type/build and frontend/backend tests against disposable PostgreSQL/Supabase; reviewed main merges deploy matching code and serialized migrations after checks pass. Separate PR/deploy credentials, protect secrets, and provide worker/scheduler, failure and restore guidance.
- [ ] Write TYPESCRIPT_STRATEGY.md only for future Resources/FormRequests -> OpenAPI -> TypeScript setup. Include rationale, prerequisites, proposed commands, inference limits, maintenance and future CI drift checking. Do not install/configure/run the TypeScript generator or require generated artifacts in this issue.
- [ ] Requirement mapping: FR44 sets up API documentation; each endpoint owner maintains their documentation. FR74/FR75 establish shared retry, revision, transaction, audit and database safeguards here; every state-changing feature must apply and test them. FR76 is the written list of excluded MVP features, not an implementation deliverable.
- [ ] Install a Laravel-compatible Telescope version, publish its provider/config/assets/migrations and configure storage on the private Laravel schema/connection. Enable request, exception, query and job watchers needed for development; configure query thresholds, filtering and scheduled telescope:prune retention. Document reproducible installation and environment settings.
- [ ] Create every approved MVP domain/support table plus Laravel users, sessions, password_reset_tokens and UUID-compatible personal_access_tokens in the private laravel schema. user_profiles.id references users.id; HasApiTokens belongs to the users Authenticatable model. Supabase supplies PostgreSQL/Storage only. Preserve all rental constraints; P2 reviews stay deferred.
- [ ] Install/configure Fortify (web guard, headless forms, registration/password reset/email verification) and Sanctum (statefulApi middleware, abilities aliases). Configure database sessions, exact stateful frontend host:port list, explicit credentialed CORS and Laravel CSRF validation. Do not exempt api/* or login from CSRF.
- [ ] Publish tested localhost and HTTPS sibling-subdomain environment templates. Include session cookie domain/Secure/HttpOnly/SameSite, mail/reset/verification URLs and allowed redirects. Unrelated default frontend/API domains require a tested same-origin proxy or shared-parent domain before release.
- [ ] Create deterministic users/profile seeders with Laravel password hashes and verified fixture timestamps, plus browser-session and scoped/expired/revoked PAT test factories. Do not call Supabase Auth or reseed hosted production.
- [ ] If existing accounts/data exist, provide a reviewed migration/backfill plan preserving UUIDs and references, verify account ownership and force Laravel password reset where necessary; invalidate legacy credentials and remove old auth.users FK/bridge only after backfill checks. Never copy unknown provider hashes blindly or delete domain records.
- [ ] Keep Telescope local by default. Any enabled nonlocal dashboard uses a tested Laravel session and restricted viewTelescope gate; deny guests/ordinary users. Filter passwords, reset links, cookies, CSRF values, token secrets/hashes, contacts and contract data. Pruning is separate from immutable business audits.

## Frontend deliverables

- [ ] Establish the supported Next.js app, design tokens, typed fetch client, TanStack Query providers and common error/loading/empty components while preserving implemented UI/assets.
- [ ] Provide one credentialed browser API client with JSON Accept and X-XSRF-TOKEN support, TanStack Query boundaries and explicit response types. Document 401/419 recovery without blind write retries. Hien owns account forms and token settings in RNT-03; TypeScript generator setup remains documentation only.

## Acceptance criteria

- [ ] A fresh local Supabase environment builds the complete MVP schema and deterministic representative seeds from committed scripts.
- [ ] PostgreSQL independently rejects overlapping blocked periods, inconsistent references and term/document mutation; adjacent periods are allowed and first legitimate confirmation metadata writes are allowed.
- [ ] The browser cannot bypass Laravel through unintended Data API grants or access a private bucket; users/profile UUID links resolve without any Supabase Auth dependency.
- [ ] All four teammates can pull the checkpoint and run migrations locally; configuration does not pretend search_path creates/moves existing tables.
- [ ] A single owner, Khai, delivers migrations/seeds, connection instructions, coding/LLM rules, CI/CD and TypeScript setup documentation in this grouped issue.
- [ ] PR CI fails on deliberate backend/frontend test and lint/typecheck errors; failed checks or migrations block hosted deployment. Main deployment is serialized and never resets/reseeds production.
- [ ] AGENTS.md names required checks and per-feature tests; another member reproduces local setup using documented commands.
- [ ] TypeScript strategy documents future setup accurately; acceptance requires no installed TS generator, generated types or generated-file drift gate. Existing frontend typecheck/build and actual response tests remain required.
- [ ] Closing RNT-01 proves shared safeguards and setup only. It does not claim all feature-specific FR74/FR75 scenarios are complete; those belong to the feature owners. FR76 is recorded as a project scope rule.
- [ ] Fresh and upgrade migrations create Sanctum token storage compatible with UUID profile IDs. API tokens and their hashes are not exposed through the Supabase Data API or logs; local/CI token fixtures support ability/expiry/revocation tests.
- [ ] A teammate follows setup instructions and sees a controlled local request, exception, query and queued-job record in Telescope. Scheduled pruning removes expired diagnostic entries without touching business audit/history data.
- [ ] Shared/deployed Telescope access is disabled or explicitly restricted; guest/ordinary-user access is denied in non-local tests. Representative captured entries contain no session/CSRF/reset/API-token secrets, passwords, private contacts or contract payloads.
- [ ] Fresh migrations and existing-data upgrade retain domain UUID links and create Laravel credential/session/reset/PAT storage; no browser login creates a PAT.
- [ ] Local and deployment configuration exercises a session request with valid CSRF and denies a missing/mismatched-CSRF write; test harness does not silently bypass CSRF. Credentialed origins are explicit; secrets stay server-side.

## Tests/evidence owned by this member

- [ ] Real PostgreSQL integration tests for migration rebuild/upgrade, constraints, concurrent overlap/uniqueness and rollback invariants.
- [ ] Configuration/client component tests for shared error handling; smoke-test the frontend/backend scaffold without transferring feature tests from their owners.
- [ ] Exercise CI intentional-failure blocking and disposable migration/seed rebuild; record actual results and direct-connection preflight. Verify setup docs by a teammate walkthrough.
- [ ] Configuration/integration tests for Telescope migration/storage, environment enable/disable, non-local access denial, filtering/redaction and scheduled pruning; record a short manual local-dashboard verification. No E2E suite required.
- [ ] Configuration and HTTP integration checks for Fortify routes, session rotation, CSRF enforcement, exact CORS/stateful domains, private auth tables and deterministic auth fixtures; Hien owns full account/token feature tests.

## NFRs, boundaries and coordination

NFR-02, NFR-03, NFR-06, NFR-07, NFR-05

NFR-02, NFR-03, NFR-06, NFR-07, NFR-05; T1a, T1b, T1c, T1d, T3a, T3g, T4c, T4d, T2a, T2b, T3c, T4b, T5a
Khai is the sole initial shared-setup owner. Kien reviews. Other members consume the early schema/convention checkpoint and own their complete feature slices/tests; later feature schema changes use reviewed additive migrations. Hien owns authentication/profile implementation. RNT-13 tests and improves Khai’s pipeline rather than assigning setup to another member. Future TypeScript generation is documentation only. Khai owns initial Telescope configuration (T5a). Tri uses that setup for diagnostics, correlation and real alert delivery in RNT-12; Telescope itself is not the alert-delivery implementation.
Authentication update: Khai owns package/schema/shared-client setup; Hien owns FR01/02/04/05/43/49/89/90 implementation. All members use and test browser CSRF on their forms; no extra micro-issues.

## Definition of done

- [ ] Implement related frontend, backend and meaningful unit/component/API/PostgreSQL integration tests; all feature owners test their own changes.
- [ ] Private routes use auth:sanctum and current account/resource Policies. Browser writes require CSRF; approved PAT endpoints additionally enforce abilities. Session-only endpoints reject PAT-only callers.
- [ ] Update FormRequests/Resources/OpenAPI and explicit frontend types. Future TypeScript generation remains documentation only.
- [ ] Apply transaction/revision/idempotency/audit rules to domain actions. Never store token secrets in replay records. Use reviewed migrations locally; never reset/reseed a hosted environment.
- [ ] Use a short manual changed-screen checklist; no required automated browser/E2E suite.
- [ ] Attach actual test commands/results and relevant evidence; specifications do not prove implementation.

RNT-01 is a planning key, not a GitHub number. Deleted issues are not reused.
