# Self-Report — Cong Khai

## Personal Information

| | |
| -------------- | ----------------------------------------------------- |
| **Full name** | Cong Khai (Git author: Cong Khai / Dang Cong Khai) |
| **Student ID** | 23040004 |
| **Team** | Advanced Web · Nhóm 1 (Advanced Group 1) |
| **Role** | Full-stack developer, with substantial backend, infrastructure, and delivery work |
| **GitHub** | [DangCongKhai](https://github.com/DangCongKhai) |
| **Commits** | 110 / 247 non-merge commits on `origin/main` (≈ 44.5% by commit count) |

> **Counting method:** I counted non-merge commits reachable from `origin/main` and combined the repository author identities `Cong Khai <dangcongkhai2k5@gmail.com>` and `Dang Cong Khai <135003930+DangCongKhai@users.noreply.github.com>`. This percentage describes commit volume, not time spent or overall team effort.

---

## Task 1 — Project foundation, frontend setup, and delivery guidance

**Week:** 2026-10-19 – 2026-10-24

**Work:**

- Set up the Next.js frontend and added initial design and development guidance for the project.
- Wrote and maintained project documentation, issue templates, implementation notes, and course-aligned planning.
- Established database and seed-data foundations, authentication documentation, local CI scripts, and frontend/backend connection checks.
- Helped prepare the project for repeatable development by documenting setup and keeping CI configuration aligned with the repository.

**Evidence of contribution:**

- `08f2177` — feat: add design guidance (2026-10-19)
- `4187234` — feat: set up next frontend (2026-10-20)
- `4523626` — docs: add necessary docs for rentOS (2026-10-20)
- `8b3c4ba` — build: set up initial database schema and data seeding for testing (2026-10-23)
- `be29825` — build: add ci for frontend and backend (2026-10-23)
- `429080e` — feat: add frontend to backend connection testing (2026-10-23)
- PR #87 — project guidance setup (merge recorded in repository history).

**Problems:**

Early setup crossed frontend, backend, and course documentation concerns. Changes to schemas, generated types, and CI could break more than one area at once, so the setup required repeated integration fixes and clearer project guidance.

**Self-Assessment:** **9.5/10**

---

## Task 2 — Public discovery, listing experience, and owner property management

**Week:** 2026-10-28 – 2026-11-04

**Work:**

- Built public listing search and detail APIs, URL-backed search state, and the public home/search-results experience.
- Improved listing-detail presentation, image loading, search filters, and location/date handling.
- Implemented owner-side property and unit workflows, including unit details, property media/gallery support, and image upload improvements.
- Refined property creation and listing UI, added user feedback with toast notifications, and fixed address, map rerender, media, and CI issues found during integration.

**Evidence of contribution:**

- `9c08532` — feat: add public listing search and detail APIs (2026-10-28)
- `3286b2b` — feat: add listing search URL state (2026-10-28)
- `eccce80` — feat: build the public home and search results (2026-10-28)
- `369330b` — feat: build listing detail, enquiry form, and unavailable page (2026-10-28)
- `ef20c50` — feat: add unit details view (2026-10-29)
- `c625c7a` — refactor: give each property and listing its own page, and simplify rooms, photos, and preview (2026-11-03)
- `aa9bfee` — refactor(owner): improve image uploading UI (2026-11-03)
- `f0e2f7c` — feat(property): accept shared media and property gallery (2026-11-04)
- PR #117 — landing page, browse/search listings, and listing details; PR #118 — owner property, unit, photo, amenity, and listing management (both appear in merge history).

**Problems:**

The listing and property workflows needed coordinated API/UI changes. Image handling also exposed storage visibility, map rerender, stale property data, and form-submission edge cases; these were addressed through follow-up fixes and UI refinements.

**Self-Assessment:** **9.5/10**

---

## Task 3 — Notifications, authentication, account security, and CI/CD

**Week:** 2026-11-10 – 2026-11-18

**Work:**

- Added notification endpoints and email delivery support, then implemented notification UI across tenant, owner, and admin areas.
- Implemented personal access token management across frontend and Laravel Sanctum, including middleware/controller work and protections for session- and token-based access.
- Improved client-side account/session behavior and frontend API organization.
- Built and refined container and deployment workflows, including separate CI/CD steps, image build/push configuration, PHP-FPM logging, and deployment guidance.
- Fixed integration issues found by typechecking, linting, authorization tests, and deployment configuration.

**Evidence of contribution:**

- `3cbd445` — feat(notification): add notification endpoints and email services (2026-11-10)
- `f887a62` — feat: notifications UI for tenant, owner and admin (2026-11-10)
- `e031dde` — build(frontend): initial image build setup for frontend (2026-11-11)
- `d418a63` — build: add build step and push images to Dokploy (2026-11-11)
- `5482031` — fix: use TanStack Query for managing user data fetching (2026-11-14)
- `91861e2` — feat(PAT): add frontend for token management (2026-11-17)
- `4e4ed26` — feat(PAT): add backend for Laravel Sanctum token authentication (2026-11-17)
- `99aeb29` — feat: add throttling for resource protection under session and token authentication (2026-11-18)
- `d81f8c2` — fix: add tests and gating for unauthorized access to other API endpoints (2026-11-18)

**Problems:**

Authentication behavior differed between browser sessions and personal access tokens, while notifications crossed database, email, and UI boundaries. CI and deployment work also required iteration when lint, type, and configuration checks caught issues.

**Self-Assessment:** **9.5/10**

---

## Task 4 — Monitoring, alerting, deployment reliability, and API-token follow-through

**Week:** 2026-11-19 – 2026-11-21

**Work:**

- Set up monitoring and alerting guidance, including Netdata thresholds and failed-job alert behavior.
- Improved error pages and user-facing error messages, and clarified alert policy and Telescope scope.
- Added backend/worker Compose configuration and enabled deployment triggers for the development branch.
- Continued token-authentication and API middleware work and resolved lint, test, and integration issues.

**Evidence of contribution:**

- `18199e5` — feat(monitoring): initial setup for monitoring and alerting system (2026-11-19)
- `a1c3be8` — feat: error page and clearer error message (2026-11-19)
- `be6fddf` — build: backend and worker Compose (2026-11-19)
- `5a56911` — build: allow deployment trigger on develop branch (2026-11-19)
- `c4673b5` — feat(monitoring): Netdata guidance for disk, memory and network monitoring (2026-11-20)
- `d9ed5b4` — fix: failed job alerting, more test coverage (2026-11-20)
- `44523f1` — refactor: personal access token middleware controller (2026-11-21)

**Problems:**

Monitoring needed actionable thresholds and useful failure signals rather than just dashboards. Alert behavior, Telescope scope, and deployment triggers required follow-up testing and configuration corrections.

**Self-Assessment:** **9.5/10**

---

## Task 5 — Performance, caching, coverage, UI polish, and final evidence

**Week:** 2026-11-23 – 2026-11-28

**Work:**

- Improved public API response caching with `Cache-Control`, ETags, and `304` responses, and kept listing-cache invalidation aligned with tenancy and moderation changes.
- Optimized database access and resource loading, added indexes and model factories/seeders, and enforced strict Eloquent behavior to expose inefficient queries.
- Split listing dialogs and image loading out of the initial frontend bundle, improved image/font loading, and refined listing UI.
- Added frontend tests aimed at the course coverage threshold and helped resolve final lint, admin rendering/reporting, and demo-evidence issues.
- Prepared monitoring and service evidence for the final project deliverables.

**Evidence of contribution:**

- `70f9449` — fix(RNT-17): clear listing cache after availability-changing tenancy actions (2026-11-24; PR #136)
- `64dd156` — feat(RNT-17): add Cache-Control, ETag and 304 to public API reads (2026-11-25)
- `ac896ab` — perf(RNT-17): enforce strict Eloquent mode and fix what it found (2026-11-25)
- `68844ab` — perf(RNT-17): index aged-request scan and owner inbox (2026-11-25)
- `15665fa` — perf(RNT-17): split listing dialogs and image loading out of the initial bundle (2026-11-25)
- `9f54a81` — test: add frontend tests to increase coverage above 70% (2026-11-25)
- `1c8fe63` — fix: improve image and font loading (2026-11-25)
- `b3977b7` — fix(RNT-16): admin route rendering and reporting logic (2026-11-26)
- `2eff6be` — docs(RNT-116): add Supabase, Resend, and Netdata monitoring evidence (2026-11-26)
- PRs #139, #140, #142, and #144 are represented in the merge history by the performance/cache, performance optimization, UI polish, and demo-evidence branches; verify exact PR ownership before submitting if the course requires PR-by-PR attribution.

**Problems:**

Caching required invalidation across several state-changing workflows, and performance work needed query-level evidence to avoid trading correctness for speed. Final delivery also exposed UI, lint, and evidence mismatches that needed corrections.

**Self-Assessment:** **9.5/10**

---

## Additional Contribution — Cross-cutting project delivery and maintenance

Across the project, I contributed to issue planning and documentation, CI stability, developer guidance, frontend/backend integration, deployment, and production-readiness work. The history also includes fixes for authorization boundaries, stale data, media handling, error states, and monitoring. These contributions complemented the larger feature tasks and helped keep the application buildable and reviewable as multiple contributors worked across shared areas.

## Personal Contribution Summary

The repository history attributes 110 non-merge commits on `origin/main` to my two matching author identities, out of 247 non-merge commits in total. My work spans project setup, public discovery, owner property workflows, authentication and notifications, monitoring/deployment, and later performance and coverage improvements. The strongest evidence of my contribution is the set of concrete code, test, documentation, and infrastructure commits listed above. Commit count is only a rough indicator; it does not measure review effort, task complexity, or contributions made outside Git.

**Estimated % contribution to the team:** ~40–45% (≈ 44.5% by non-merge commit count; effort also includes integration, CI, and delivery work that is not fully captured by commit volume).

**Overall Self-Assessment Score:** **9.75/10**

---

### Scoring rationale

| Task | Score | Why |
| ---- | ----- | --- |
| 1 | 9.5 | Unblocked the whole team: Next.js bootstrap, design/dev guidance, docs/planning, schema/seed foundations, and first CI + frontend↔backend connection checks that later features depended on. |
| 2 | 9.5 | Core product surface: public discovery + owner property/unit/media (PRs #117–#118) with clear end-to-end ownership across API and UI. |
| 3 | 9.5 | Hard full-stack work: notifications + Sanctum PAT + session/token auth gating + CI/CD image pipeline to Dokploy. |
| 4 | 9.5 | Production-readiness sprint: Netdata thresholds, failed-job alerting, clearer error UX, Compose/worker wiring, develop-branch deploy triggers, and PAT middleware follow-through in a short, dense window. |
| 5 | 9.5 | High-impact close-out: Cache-Control/ETag/304, invalidation, Eloquent strict mode, indexes, bundle splits, coverage above threshold, and final monitoring evidence. |
| Overall | 9.75 | Per-task work averages **9.5**; the remaining **0.25** reflects sustained cross-cutting ownership (~44.5% of non-merge commits on `main`, plus integration, CI stability, and delivery maintenance across the whole project). Not a 10 only because some PR-by-PR attribution still needs a final GitHub check before submission. |

### Items to complete before submission

- Confirm the course’s exact sprint/week boundaries and adjust the date ranges if they differ.
- Check each PR number and description against GitHub before treating the listed PR attribution as final.
