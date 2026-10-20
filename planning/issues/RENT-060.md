<!-- rentos-task: RENT-060 -->

## Outcome
From a public listing, a signed-in user can submit a report. Guests are asked to sign in. The user can open a private list that shows status and the sanitized outcome, not admin notes.

## References
- Requirement IDs: FR38, FR72
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR38-AC01, FR38-AC02, FR38-AC03, FR38-AC04, FR38-AC05, FR72-AC01, FR72-AC02, FR72-AC03, FR72-AC04
- Module: M08
- Rubric IDs: None
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M08-*` when that directory exists.

## Current repository evidence
No report form exists. The API is RENT-059.

## Scope and non-goals
Report dialog on the listing page and /app/tenant/reports. Reason codes match the API. Loading, empty, and error states on the list.

Non-goals:
- Do not show a suspend control.
- Do not promise the listing will be removed.
- Do not display internal notes if a mistaken payload includes them; the UI should also ignore unknown note fields.

## Implementation checklist
- [ ] Add the dialog and list.
- [ ] Map 409, 422, and 429.
- [ ] Keep the guest path on sign-in.

## API and data contract
POST the report body with client_operation_id. GET own reports. No admin route from this UI.

## Acceptance criteria
- [ ] Guest is sent to sign in.
- [ ] 429 shows a throttle message.
- [ ] The list does not render an internal note.
- [ ] Empty list has an empty state.

## Tests and evidence
UI tests for guest, success, 429, and the absence of an internal-note label.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #95
- RENT-040 (GitHub #55)
- RENT-059 (GitHub #53)

## Ownership and review
- Planning owner: Member C
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: low
- Tentative estimate: 0.5 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M08`, priority `P0`, risk `low`
- Publication: GitHub issue #63

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

