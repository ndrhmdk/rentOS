<!-- rentos-task: RENT-021 -->

## Outcome
On a property, the owner sees units, adds one unit, pastes or builds a bulk preview, and changes operational status. The screen states that maintenance is not the same thing as a booked date range.

## References
- Requirement IDs: FR50, FR51, FR52
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR50-AC01, FR50-AC02, FR50-AC03, FR50-AC04, FR51-AC01, FR51-AC02, FR51-AC03, FR51-AC04, FR52-AC01, FR52-AC02, FR52-AC03, FR52-AC04
- Module: M02
- Rubric IDs: None
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M02-*` when that directory exists.

## Current repository evidence
No unit UI exists. The bulk API contract is RENT-020.

## Scope and non-goals
UI under the property edit route. Bulk preview is edited locally and submitted once. Each preview row keeps a stable client_operation_id. Status control submits READY, MAINTENANCE, or RETIRED.

Non-goals:
- Do not show date-availability calendars.
- Do not allow a second unit on WHOLE_SPACE.
- Do not edit contract rent here.

## Implementation checklist
- [ ] Build the unit list, single form, and bulk preview.
- [ ] Show per-row errors if the API returns them.
- [ ] Disable add when arrangement is WHOLE_SPACE and one unit exists.

## API and data contract
Calls the unit routes from RENT-020. Advertised rent is labeled as advertised, not agreed.

## Acceptance criteria
- [ ] Owner adds a room and sees it after refetch.
- [ ] A failed bulk row shows an error and the list is unchanged.
- [ ] Changing status to MAINTENANCE updates the badge.
- [ ] WHOLE_SPACE hides the add-another control.
- [ ] Empty unit list tells the owner to add a unit.

## Tests and evidence
UI tests for bulk error display, status change, and the whole-space control.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #90
- RENT-019 (GitHub #31)
- RENT-020 (GitHub #32)

## Ownership and review
- Planning owner: Member C
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: low
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M02`, priority `P0`, risk `low`
- Publication: GitHub issue #35

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

