<!-- rentos-task: RENT-059 -->

## Outcome
A signed-in user can report a visible listing with a reason code and description. The OPEN report is stored in the request, not in a queue. One live report per reporter and listing is enforced. The reporter can read their own reports with a sanitized outcome and cannot read internal notes. Configured rate limits return 429.

## References
- Requirement IDs: FR38, FR72
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR38-AC01, FR38-AC02, FR38-AC03, FR38-AC04, FR38-AC05, FR72-AC01, FR72-AC02, FR72-AC03, FR72-AC04
- Module: M08
- Rubric IDs: T4a
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M08-*` when that directory exists.

## Current repository evidence
No report controller exists. The partial unique index is RENT-009. BR20 forbids automatic hide based on report count.

## Scope and non-goals
POST /api/v1/listings/{listing}/reports and GET /api/v1/me/reports. Rate limit per user and IP. Recheck listing visibility under the property lock. Insert an outbox row in the same transaction for the admin alert, without hiding the listing.

Non-goals:
- Do not auto-suspend.
- Do not accept guest reports.
- Do not let the client set status or reporter_id.
- Do not build the admin queue.

## Implementation checklist
- [ ] Add store and reporter index.
- [ ] Map the unique violation to the existing report response.
- [ ] Throttle and test 429.
- [ ] Omit internal_notes from the reporter resource.

## API and data contract
POST 201 OPEN. Duplicate live report 409 with the existing id. 422 for bad reason or empty description. 404 if the listing is not visible. 401 for guests. GET own reports 200 without internal notes. 429 when limited.

## Acceptance criteria
- [ ] A report does not set admin_suspended_at.
- [ ] Guest POST returns 401.
- [ ] Two concurrent reports leave one OPEN row.
- [ ] A hidden listing returns 404 and keeps older reports.
- [ ] Reporter JSON has no internal_notes.
- [ ] The sixth request in the test window returns 429 when the limit is five.

## Tests and evidence
Postgres feature tests for create, race, hidden listing, reporter privacy, and throttle.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #95
- RENT-016 (GitHub #23)
- RENT-009 (GitHub #17)
- RENT-033 (GitHub #47)

## Ownership and review
- Planning owner: Member B
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: high
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M08`, priority `P0`, risk `high`
- Publication: GitHub issue #53

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

