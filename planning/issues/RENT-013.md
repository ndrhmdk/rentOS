<!-- rentos-task: RENT-013 -->

## Outcome
The first valid request from a confirmed Supabase user creates one user_profiles row with is_admin false. GET and PATCH /api/v1/me/profile read and update only full_name and phone. Email confirmation and password reset stay in Supabase Auth. A repeated bootstrap does not reset an existing name or admin flag.

## References
- Requirement IDs: FR01, FR06, FR49
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR01-AC01, FR01-AC02, FR01-AC03, FR01-AC04, FR06-AC01, FR06-AC02, FR06-AC03, FR49-AC01, FR49-AC02, FR49-AC03
- Module: M01
- Rubric IDs: T3b
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M01-*` when that directory exists.

## Current repository evidence
No profile controller exists. FR49 says email confirmation and password reset are required and the architecture assigns them to Supabase Auth. The integer users table is still the only local user table until RENT-006 lands.

## Scope and non-goals
Profile upsert keyed by token subject. PATCH checks expected_revision and returns 409 when stale. Admin fields are absent from the request rules. Password reset is a documented Supabase client flow, not a Laravel password_reset_tokens writer.

Non-goals:
- Do not build the Next.js forms in this issue.
- Do not let the client set is_admin or account_status.
- Do not store a second password.
- Do not send phone OTP.

## Implementation checklist
- [ ] Add ProfileController, FormRequest, and API Resource.
- [ ] Upsert on first seen subject inside a transaction.
- [ ] Reject PATCH fields outside full_name and phone.
- [ ] Document the Supabase confirm-email and reset-password URLs the frontend must call.

## API and data contract
GET /api/v1/me/profile returns id, full_name, phone, account_status, revision. PATCH requires expected_revision. 200 with the new revision. 409 if revision mismatches. 422 for invalid phone or empty name. 403 if the client sends is_admin.

## Acceptance criteria
- [ ] Two concurrent first requests for one subject leave one profile.
- [ ] PATCH full_name succeeds and increments revision.
- [ ] A stale revision returns 409 and does not change the name.
- [ ] An unconfirmed Supabase user is rejected by the auth provider before profile write, with the failure mapped in the test fixture.
- [ ] Password reset does not write Laravel password_reset_tokens.

## Tests and evidence
Feature tests for upsert race using a transaction or unique PK, stale revision, and forbidden admin field.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #89
- RENT-012 (GitHub #15)

## Ownership and review
- Planning owner: Member A
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: medium
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M01`, priority `P0`, risk `medium`
- Publication: GitHub issue #20

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

