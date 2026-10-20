<!-- rentos-task: RENT-016 -->

## Outcome
Every later private controller can call a policy for owner, tenant party, or admin. A non-owner receives 404 for another person's draft property when existence should stay private, and 403 when the resource is known but the action is forbidden. Admin routes require user_profiles.is_admin true. UI checks are not the control.

## References
- Requirement IDs: FR05
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR05-AC01, FR05-AC02, FR05-AC03, FR05-AC04
- Module: M01
- Rubric IDs: T4b
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M01-*` when that directory exists.

## Current repository evidence
No app/Policies directory exists. FR05 and security-design.md require server checks. The skeleton AuthorizesRequests path is unused.

## Scope and non-goals
Add base policies and a test-only probe route or policy unit tests that demonstrate owner, stranger, and admin decisions. Document the 404 versus 403 rule for later controllers. Suspended account_status fails closed.

Non-goals:
- Do not implement property CRUD here.
- Do not let D's screens own these checks.
- Do not trust a query parameter user_id.
- Do not grant admin by email domain.

## Implementation checklist
- [ ] Add Policy classes and a gate for admin.
- [ ] Define the disclosure rule in a short comment used by later FormRequests.
- [ ] Test stranger, owner, admin, and suspended account.

## API and data contract
Actor comes from the JWT guard. 401 unauthenticated, 403 forbidden, 404 hidden. Admin is is_admin on the profile row.

## Acceptance criteria
- [ ] A non-admin calling an admin probe receives 403.
- [ ] A stranger requesting a private probe id receives 404.
- [ ] The owner of the probe receives 200.
- [ ] A suspended profile receives 403 on the probe.
- [ ] A body user_id is ignored.

## Tests and evidence
Feature tests with three profiles. These tests are the pattern later issues extend.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #89
- RENT-013 (GitHub #20)

## Ownership and review
- Planning owner: Member A
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: high
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M01`, priority `P0`, risk `high`
- Publication: GitHub issue #23

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

