<!-- rentos-task: RENT-018 -->

## Outcome
An owner can create a property draft, update it, and archive it through a resource controller. Creation does not enter a moderation queue. Archive keeps the row. Another user cannot read or edit the draft.

## References
- Requirement IDs: FR07, FR08, FR41
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR07-AC01, FR07-AC02, FR07-AC03, FR07-AC04, FR08-AC01, FR08-AC02, FR08-AC03, FR08-AC04, FR41-AC01, FR41-AC02, FR41-AC03
- Module: M02
- Rubric IDs: T4a
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M02-*` when that directory exists.

## Current repository evidence
No PropertyController exists. WF-01 and WF-21 are unimplemented. GET /api/health is the only API route.

## Scope and non-goals
Resource controller, FormRequest, Policy, and API Resource for /api/v1/properties. Create requires client_operation_id. WHOLE_SPACE and SEPARATE_UNITS are accepted as rental_arrangement. Incomplete address is allowed on draft. Archive sets archived_at and increments revision.

Non-goals:
- Do not create units automatically except the guard tested in RENT-020.
- Do not create a listing.
- Do not geocode.
- Do not hard-delete a property that could be referenced later.

## Implementation checklist
- [ ] Add routes and controller methods index, store, show, update, archive.
- [ ] Authorize owner_id from the token.
- [ ] Return 404 to other users.
- [ ] Use idempotency on store.

## API and data contract
POST /api/v1/properties 201. GET collection only own non-archived by default, with archived filter. PATCH with expected_revision. POST /api/v1/properties/{property}/archive 200. 409 on stale revision or idempotency hash clash. 422 on unknown property_type.

## Acceptance criteria
- [ ] Owner creates a draft and sees it on a later GET.
- [ ] A second user receives 404 for that id.
- [ ] Archive hides it from the default index and keeps the row.
- [ ] Replay of the same client_operation_id returns the same id.
- [ ] No listing row is created.

## Tests and evidence
Feature tests for ownership, archive, validation, and idempotent create. Scramble annotations wait for RENT-071, but FormRequest rules must already exist.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #90
- RENT-007 (GitHub #14)
- RENT-017 (GitHub #25)

## Ownership and review
- Planning owner: Member B
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: medium
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M02`, priority `P0`, risk `medium`
- Publication: GitHub issue #28

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

