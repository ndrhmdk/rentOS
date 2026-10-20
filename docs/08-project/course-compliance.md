# Course compliance and evidence

Source: Advanced Web Final Project Brief CSB35050 VNUK(2).docx, assessment tasks and rubric. Total10marks; final project weighting50%; reference duration5weeks. Preserve actual grading conditions; no claim that a substitution is approved beyond user report.

| ID | Marks | Printed criterion | Concrete deliverable/evidence | Modules | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- |
| T1a | .25 | GitHub repository | Repository URL/access; organized source/history | M10 | A | Required |
| T1b | .25 | Good commit messages | Atomic commits referring to actual issue; meaningful purpose | All | All | Required |
| T1c | .25 | GitHub Issues | Well-defined issue bodies with acceptance/dependency/owner links | M10 | A | Required |
| T1d | .25 | GitHub workflow | Topic branches, linked issues and PR review history; CI supports but does not replace these | M10 | A | Required |
| T2a | .5 | Database design/migrations | Reproducible Laravel migrations, UUID schema, constraints/ERD incl favourites | M02/M06/M04 | A+B | Required |
| T2b | .5 | Seeders | Deterministic representative public/hidden/suspended, inventory, contracts, reports/favourites scenarios | All | B | Required |
| T3a | .25 | Blade Livewire Tailwind | Printed rubric names these; Next.js substitution user-reported approved, exact scoring evidence needed | M01/M10 | A | Approval scope needs evidence |
| T3b | .25 | Registration/login | Email confirmation/login/profile bootstrap and negative tests under approved provider | M01 | A | Required |
| T3c | .25 | CSRF and server validation | Actual transport threat model, framework protection where cookie credentials apply, field errors and hostile request tests | M01+All | A | Demonstration must be agreed for substituted UI |
| T3e | .25 | Query/filter/display | Seeded search full interval/same-unit filters, listing details and private favourites | M04 | C | Required |
| T3f | 1 | External API integration | Use Supabase Storage API integration: auth/config, completed upload/private download, error handling/logging, tests and demo; do not claim an SDK import alone | M02 | B | Required; confirm accepted evidence if lecturer requires another provider |
| T3g | 1 | UI/business unit+integration tests | Meaningful UI/business test suite and separately reported coverage strictly greater than70% | All | C+A | Required |
| T4a | .5 | Resource Controllers CRUD | Actual resource controllers/FormRequests/Resources with HTTP/status/validation/ownership semantics | M02/M03/M04 | B | Required |
| T4b | .25 | Sanctum token security | Printed rubric explicitly Sanctum scopes/permissions; chosen design Supabase JWT/Policies; get exact accepted replacement evidence | M01 | A | Unresolved specific substitution |
| T4c | .25 | Scramble | Installed compatible Scramble generates API docs from real code; bearer scheme and409/422 examples | M10 | A | Required |
| T4d | 1 | API unit+integration tests | Laravel API/action/policy integration coverage strictly greater than70%; real PostgreSQL race tests | All | A+B | Required |
| T5a | .25 | Telescope | Configured compatible Telescope, restricted diagnostics, useful request/query/job evidence | M10 | A | Required |
| T5b | .25 | Error handling/logging | Structured logs, friendly errors and actual critical error report/alert evidence | M10 | A | Required |
| T5c | .25 | Slow-query alert | Threshold rule and delivered deduplicated alert, not just query display | M10 | A | Required |
| T5d | .25 | Server monitoring | CPU/memory/disk/network collector and threshold alert evidence on chosen environment | M10 | A | Required |
| T6a | .5 | Asynchronous processing | Queue worker/outbox handling and scheduler jobs; failure/retry tests and duplicate safety | M09/M06/M05 | B+A | Required |
| T6b | .5 | Resource loading | Lazy loading/code split/images/bundles with measurable browser evidence | M04/M02 | C | Required |
| T6c | .5 | Caching | Document selected public caching/revalidation/invalidation and private isolation tests | M04/M03 | C+B | Required |
| T6d | .5 | Antipattern mitigation | Eager loading/indexes/query profiling and before/after evidence; no false optimization claims | M02/M04/M06 | B+A | Required |


## Submission requirements
- Root repository README must include run instructions, project overview/tools, feature list/screenshots, ERD and relevant lecturer notes. This docs directory does not replace root README.
- GitHub source, branches, issue-linked PRs and meaningful commit history.
- Each of four members submits a self-report for each of all five sprints. Brief says late/missing reports incur10% deduction from final group mark; do not replace individual evidence with a single group report.
- Screencast no longer than10minutes, at least720p MP4; YouTube public/unlisted or equivalent accessible link, not private. Demonstrate requirements in action; show logs/alerts/docs evidence where relevant, not only attractive pages.

## Explicit differences requiring evidence
User reports Next.js/Laravel/Supabase approved. Printed T3a names Blade/Livewire and T4b names Sanctum. No file here proves which scoring criteria were waived or substituted. Keep chosen stack, create a lecturer clarification/evidence task, and mark only the affected grading item pending. Continue unrelated authorized work. Do not silently add Sanctum, remove JWT, or claim original tooling is implemented.

JSONB policies/amenities are bounded descriptive attributes with canonical schemas on a relational core, not an excuse for an unstructured whole database. Explain this tradeoff in database design evidence. Supabase Storage is proposed external API evidence matching the rubric's storage API example; demonstrate integration and error handling, not just a provider login screen.
