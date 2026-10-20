<!-- rentos-task: RENT-014 -->

## Outcome
A guest can register with email and password, confirm email through Supabase, sign in, refresh an expired access token once for a safe read, reset a password, and log out. Logout clears TanStack Query caches that hold profile, favourites, requests, or contracts. A second account on the same browser does not see the previous account's cached private data.

## References
- Requirement IDs: FR01, FR02, FR04, FR49
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR01-AC01, FR01-AC02, FR01-AC03, FR01-AC04, FR02-AC01, FR02-AC02, FR02-AC03, FR02-AC04, FR04-AC01, FR04-AC02, FR04-AC03, FR49-AC01, FR49-AC02, FR49-AC03
- Module: M01
- Rubric IDs: T3b
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M01-*` when that directory exists.

## Current repository evidence
frontend/ is now a Next.js scaffold with no auth routes, auth provider wiring, or Supabase client dependency in package.json. frontend/src/app/page.tsx is still the default starter page. Design guidelines exist for form states.

## Scope and non-goals
Next.js routes /register, /login, /forgot-password, and /auth/callback. Supabase client uses the anon key. After sign-in, call GET /api/v1/me/profile with the access token. Map provider field errors onto the form. Protected routes redirect to login.

Non-goals:
- Do not add Google sign-in.
- Do not claim the access token is revoked server-side at logout.
- Do not queue a favourite save across login.
- Do not implement both dashboards beyond a link to RENT-015.

## Implementation checklist
- [ ] Add the Supabase browser client with anon key only.
- [ ] Build the four screens with loading and field errors.
- [ ] Clear the query cache on logout and on account switch.
- [ ] Retry one safe GET after a refresh; do not retry a failed POST automatically.

## API and data contract
Client stores the Supabase session using the provider's browser persistence. API calls send Authorization bearer. 401 clears the private cache and shows sign-in. Duplicate email follows the provider response without promising that the address exists.

## Acceptance criteria
- [ ] Valid registration shows the confirm-email state and, after confirmation, a profile loads.
- [ ] Wrong password shows a safe error and no profile JSON.
- [ ] Logout returns the browser to the public page and a later profile request is 401.
- [ ] Signing in as a second user does not render the first user's cached name.
- [ ] Reset password completes through the provider screen.

## Tests and evidence
UI tests for field errors, logout cache clear, and the single safe-read retry. Mock Supabase and the profile API.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #89
- RENT-004 (GitHub #3)
- RENT-013 (GitHub #20)

## Ownership and review
- Planning owner: Member C
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: medium
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M01`, priority `P0`, risk `medium`
- Publication: GitHub issue #22

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

