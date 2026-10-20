<!-- rentos-task: RENT-015 -->

## Outcome
A signed-in user sees both a tenant home and an owner home. The tenant home links to search, requests, and favourites. The owner home links to properties and enquiries. An admin entry is visible only when GET /api/v1/me/profile says the server profile is admin, and the link does not grant access by itself.

## References
- Requirement IDs: FR06
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR06-AC01, FR06-AC02, FR06-AC03
- Module: M01
- Rubric IDs: T3e
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M01-*` when that directory exists.

## Current repository evidence
No dashboard routes exist. FR06 requires dual dashboards without a role picker. is_admin is server-managed.

## Scope and non-goals
Next.js routes /app/tenant and /app/owner with navigation, loading, and signed-out redirect. Admin link reads the profile resource from RENT-013. Empty states say the lists arrive in later issues.

Non-goals:
- Do not implement the queues.
- Do not hide owner tools from a user who is also a tenant.
- Do not add a role column.
- Do not treat a client isAdmin flag as authority.

## Implementation checklist
- [ ] Add the two shells and shared nav.
- [ ] Show the admin link from the profile payload only.
- [ ] Add an empty state for each future list.

## API and data contract
Navigation uses the profile resource. No new Laravel route. Admin routes added later return 403 from the API even if the link was shown from a stale client cache.

## Acceptance criteria
- [ ] Both homes render for one non-admin user.
- [ ] The admin link is absent when is_admin is false.
- [ ] A stale client that shows the link still cannot be treated as done without the API checks in later admin issues.
- [ ] Signed-out access redirects to login.

## Tests and evidence
UI test that one profile renders both nav groups and that is_admin false hides the admin link.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #89
- RENT-014 (GitHub #22)

## Ownership and review
- Planning owner: Member C
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: low
- Tentative estimate: 0.5 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M01`, priority `P0`, risk `low`
- Publication: GitHub issue #24

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

