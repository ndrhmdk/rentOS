<!-- rentos-task: RENT-035 -->

## Outcome
An admin opens a paginated table of listing submissions. The table has loading, empty, and error states, a status filter, and keyboard-reachable paging. Until RENT-032 is merged, the screen reads a typed fixture that matches the documented DTO. The finished screen calls the real admin endpoint.

## References
- Requirement IDs: FR13
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR13-AC01, FR13-AC02, FR13-AC03
- Module: M08
- Rubric IDs: None
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M08-*` when that directory exists.

## Current repository evidence
No admin UI exists. issue-authoring.md assigns this bounded screen to Member D. The API is owned by RENT-032.

## Scope and non-goals
Route /app/admin/listing-submissions. Columns: title, owner display name, submitted time, status. Page size follows the API. Fixture file lives in frontend and is not used once the real client is wired. Accessible table headers and a visible focus state.

Non-goals:
- Do not implement approve or reject.
- Do not check is_admin only in the component and skip the API.
- Do not build report rows in this table.
- Do not own the revision lock.

## Implementation checklist
- [ ] Add the table, filter, pager, and three states.
- [ ] Type the fixture to the RENT-032 response.
- [ ] Replace the fixture base URL with the real GET when that route is available.
- [ ] Add basic axe or testing-library accessibility assertions for headers and buttons.

## API and data contract
GET /api/v1/admin/listing-submissions?status=&page=. Renders only fields in that DTO. Shows a forbidden state on 403.

## Acceptance criteria
- [ ] Loading, empty, and error states are reachable in tests.
- [ ] Paging updates the page query.
- [ ] A 403 renders a forbidden message rather than an empty success table.
- [ ] The table can be used without a mouse for next page.
- [ ] Fixture mode is clearly named so it cannot be mistaken for production data.

## Tests and evidence
UI tests for loading, empty, error, 403, and next page. Accessibility assertion for column headers.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #91
- RENT-004 (GitHub #3)
- RENT-015 (GitHub #24)

## Ownership and review
- Planning owner: Member D
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: low
- Tentative estimate: 0.5 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M08`, priority `P0`, risk `low`
- Publication: GitHub issue #26

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

