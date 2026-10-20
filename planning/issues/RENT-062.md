<!-- rentos-task: RENT-062 -->

## Outcome
An admin sees a paginated, filterable table of reports with loading, empty, and error states. Filters include OPEN and REVIEWING. The table does not show the reporter's private contact beyond the display name the API chooses to send, and it does not decide the report.

## References
- Requirement IDs: FR39
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR39-AC01, FR39-AC02, FR39-AC03, FR39-AC04
- Module: M08
- Rubric IDs: None
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M08-*` when that directory exists.

## Current repository evidence
No report table UI exists. The API is RENT-061. D may start from a typed fixture.

## Scope and non-goals
Route /app/admin/reports. Accessible table, status filter, pager, and 403 state. Fixture until the real GET is wired.

Non-goals:
- Do not resolve, dismiss, or suspend.
- Do not show internal notes in the table if the DTO marks them admin-only; wait for the detail issue.
- Do not implement rate limits.

## Implementation checklist
- [ ] Build the table and states.
- [ ] Type the fixture to the admin report list DTO.
- [ ] Add keyboard paging.

## API and data contract
GET /api/v1/admin/reports. Renders status, reason_code, listing title, and created time. 403 shows forbidden.

## Acceptance criteria
- [ ] Empty, loading, and error states render.
- [ ] Filter changes the query.
- [ ] 403 is not shown as an empty queue.
- [ ] No resolve button submits from this issue's tests.

## Tests and evidence
UI tests for empty, error, filter, and 403.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #95
- RENT-004 (GitHub #3)
- RENT-015 (GitHub #24)

## Ownership and review
- Planning owner: Member D
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: low
- Tentative estimate: 0.5 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M08`, priority `P0`, risk `low`
- Publication: GitHub issue #27

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

