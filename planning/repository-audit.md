# Repository audit

Audit date: 20 October 2026. Repository `ndrhmdk/rentOS` at `https://github.com/ndrhmdk/rentOS`. Default branch `develop`. Local branch `project_guidance_setup` tracking `origin/project_guidance_setup` at commit `08f2177` (`feat: add design guidance`). Earlier commits on the branch are `44c127f` and `a0d2ac5`, both message `initial commit`.

## What was checked
- Root `README.md`, `backend/README.md`, `backend/AGENTS.md`, `backend/composer.json`, `frontend/package.json`, `backend/routes/api.php`, `backend/phpunit.xml`, and migrations under `backend/database/migrations`.
- `docs/README.md`, `docs/08-project/*` except two linked files that are not on disk, the acceptance catalogue and traceability matrix, API design, data model, data dictionary, business rules, state transitions, security design, and the module PRDs needed for contracts.
- `design/` brand and UI notes. `.github/PULL_REQUEST_TEMPLATE.md`. No `.github/workflows` file.
- `gh auth status` as `DangCongKhai`. `gh repo view` for `ndrhmdk/rentOS`. Permissions from the API: pull, push, and triage are true; admin and maintain are false. Issues are enabled. Open and closed issue lists were empty. Open and closed pull requests were empty. Collaborators: `ndrhmdk` admin, `DangCongKhai` write. Labels are the GitHub defaults. Milestones: none.
- Working tree is dirty: `docs/` and root `frontend/` are untracked, `CONTRIBUTING.md` is deleted, and the committed `backend/frontend` Vite trees are deleted locally and not committed.

## Implementation status
| Area | Status | Evidence |
| --- | --- | --- |
| Product domain | Missing | No property, listing, tenancy, report, or favourite models or routes |
| API | Partial skeleton | `GET /api/health` only in `backend/routes/api.php` |
| Identity | Missing, with a conflicting skeleton | Integer `users` table and `laravel/sanctum` are installed. No JWT guard. No `user_profiles` |
| Database | Framework only | Users, cache, jobs, personal access tokens. `phpunit.xml` sets `DB_CONNECTION=sqlite` |
| Frontend | Missing product UI | Untracked Vite React app at `frontend/`. Spec requires Next.js. Nested Vite apps exist in git HEAD under `backend/frontend` |
| Tests | Skeleton only | `backend/tests/Unit/ExampleTest.php` and `backend/tests/Feature/ExampleTest.php` |
| CI | Missing | No workflow files |
| Favourites | Missing | Specified as FR88. No `favourite_properties` code |
| Docs | Present locally, unpublished | `docs/` is untracked. `docs/08-project/source-register.md` and `local-ai-issue-prompt.md` are linked from `docs/08-project/README.md` and are not on disk |
| GitHub issues | None | Empty issue list before this backlog |

Nothing in the application tree is classified as implemented and verified for a product FR.

## Stack decisions
The spec and course note require Next.js, Laravel, and Supabase Postgres, Auth, and Storage. The root README still says React. Sanctum is installed and must not become a second identity store. Printed rubric rows T3a (Blade/Livewire) and T4b (Sanctum) have no lecturer file in the repo. CSRF demonstration for a bearer client is also unresolved. Those are RENT-001 and RENT-002. Other work is not blocked.

## Course rows
Every printed row in `docs/08-project/course-compliance.md` is required. Product P2 is not a reason to drop Telescope, coverage, or the demo. T1c is this backlog. The other rows have implementation issues. Five sprint weeks are the teacher's template. Remaining capacity and real sprint dates were not found.

## Intentionally not scheduled as build work
| ID | Priority | Reason |
| --- | --- | --- |
| FR03 | P2 | Google sign-in |
| FR16 | P2 | Dedicated changes-requested state |
| FR22, FR23 | P2 | Interactive map |
| FR24 | P2 | Geocoding |
| FR36, FR37, FR79 | P2 | Property reviews and review moderation |
| FR76 | P3 | Excluded MVP scope record, not a feature to build |

Retired numbers FR53, FR54, FR58, and FR62–FR65 are not reused.

## Unknowns
- Which person is Member A, B, C, or D. Issues stay unassigned.
- How many days remain, and each person's capacity.
- Which machine will run the worker and the CPU, memory, disk, and network collector.
- The lecturer's written answer on T3a, T4b, and the CSRF demo.
- Whether the 48 hour hold and the favourite placeholder rules stay at the documented defaults. The issues implement those defaults and mark them configurable.
