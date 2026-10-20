<!-- rentos-task: RENT-020 -->

## Outcome
An owner can add units one at a time or from a complete bulk preview, edit advertised terms, and set operational_status to READY, MAINTENANCE, or RETIRED without changing any tenancy dates. WHOLE_SPACE properties keep exactly one auto-created unit. SEPARATE_UNITS properties reject a second label that normalizes to an existing label.

## References
- Requirement IDs: FR50, FR51, FR52, FR41
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR50-AC01, FR50-AC02, FR50-AC03, FR50-AC04, FR51-AC01, FR51-AC02, FR51-AC03, FR51-AC04, FR52-AC01, FR52-AC02, FR52-AC03, FR52-AC04, FR41-AC01, FR41-AC02, FR41-AC03
- Module: M02
- Rubric IDs: T4a
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M02-*` when that directory exists.

## Current repository evidence
No unit routes exist. BR01 and BR14 separate operational status from date availability. minimum_rental_months is at least 3 in the dictionary.

## Scope and non-goals
CRUD under /api/v1/properties/{property}/units and POST .../units/bulk. Bulk is atomic: all rows commit or none do. Each bulk row has its own client_operation_id. Operational status patch does not write tenancy rows. Marketing flag is_marketed stays false until required fields are present.

Non-goals:
- Do not treat MAINTENANCE as a date block in the exclusion constraint.
- Do not calculate search availability here.
- Do not delete units that are referenced; archive them.
- Do not invent a property-level RENTED flag.

## Implementation checklist
- [ ] Add UnitController and bulk action.
- [ ] Auto-create the single WHOLE_SPACE unit inside property creation or the first unit call, and test that a second unit is rejected.
- [ ] Validate rent, deposit, and minimum months.
- [ ] Lock the property row during bulk insert.

## API and data contract
POST unit 201. POST bulk 201 with an array of units. 422 if any row is invalid, with no partial insert. PATCH operational_status 200. 409 on duplicate client_operation_id with a different hash or duplicate normalized label.

## Acceptance criteria
- [ ] Bulk of two valid rooms commits both.
- [ ] One invalid row rolls back the batch.
- [ ] Retry of one row key returns that row rather than a duplicate.
- [ ] Setting MAINTENANCE leaves tenancy tables unchanged.
- [ ] WHOLE_SPACE cannot gain a second unit.
- [ ] minimum_rental_months of 2 returns 422.

## Tests and evidence
Feature tests including a Postgres transaction rollback for the failed bulk row and the whole-space guard.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #90
- RENT-018 (GitHub #28)

## Ownership and review
- Planning owner: Member B
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: high
- Tentative estimate: 1.5 days
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M02`, priority `P0`, risk `high`
- Publication: GitHub issue #32

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

