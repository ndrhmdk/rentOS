<!-- rentos-task: RENT-012 -->

## Outcome
Laravel accepts a Supabase access token on Authorization: Bearer, checks issuer, audience, expiry, subject, and signature against the project JWKS, and resolves one active user_profiles row. Invalid, expired, or unknown-signature tokens fail closed. The API does not issue Sanctum personal access tokens.

## References
- Requirement IDs: FR43
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR43-AC01, FR43-AC02, FR43-AC03, FR43-AC04, FR43-AC05
- Module: M01
- Rubric IDs: T4b, T3b
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M01-*` when that directory exists.

## Current repository evidence
routes/api.php has GET /api/health only. laravel/sanctum is installed and config/sanctum.php exists, with no product token route. No JWKS client exists under backend/app. docs/07-architecture/security-design.md is the verification rule.

## Scope and non-goals
Add a guard that fetches JWKS from the configured project URL, caches keys, and refreshes once on an unknown kid. Bind the authenticated profile. Reject is_admin or sub supplied in the JSON body. Leave Sanctum installed but unused for product authentication unless the team explicitly chooses a different approved auth direction later.

Non-goals:
- Do not add a Laravel password login.
- Do not follow a jku header from the token.
- Do not accept the anon key as a user token.
- Do not implement Google OAuth.

## Implementation checklist
- [ ] Implement the guard and middleware alias auth.supabase.
- [ ] Cache JWKS with a bounded TTL and one refresh.
- [ ] Add 401 responses through the shared error shape once RENT-017 exists; until then use a local JSON 401 that RENT-017 can replace.
- [ ] Document that logout does not revoke an already issued JWT before exp.

## API and data contract
Authorization bearer required for private /api/v1 routes. 401 on failure. Profile account_status SUSPENDED returns 403. Actor id is the token subject matched to user_profiles.id.

## Acceptance criteria
- [ ] A valid test token for a seeded profile authenticates.
- [ ] Expired, wrong audience, wrong issuer, and bad signature return 401.
- [ ] A body field is_admin true does not change the profile.
- [ ] An unknown kid refreshes JWKS once and then fails closed.
- [ ] No /api/sanctum or PAT create route is added.

## Tests and evidence
Feature tests with a local RSA JWKS fixture, not the production project. Cover FR43-AC01 through FR43-AC05.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #89
- RENT-005 (GitHub #4)
- RENT-006 (GitHub #9)

## Ownership and review
- Planning owner: Member A
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: high
- Tentative estimate: 2 days
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M01`, priority `P0`, risk `high`
- Publication: GitHub issue #15

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

