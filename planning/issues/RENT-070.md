<!-- rentos-task: RENT-070 -->

## Outcome
The signed-in user opens a notification list, sees unread and read items, and can mark one read. Logout removes the cached list.

## References
- Requirement IDs: FR73
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR73-AC01, FR73-AC02, FR73-AC03
- Module: M09
- Rubric IDs: None
- Product priority: P1
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M09-*` when that directory exists.

## Current repository evidence
No inbox UI exists. The API is RENT-069.

## Scope and non-goals
Route /app/notifications with loading, empty, and error states. Badge count on the shell from the unread page metadata if the API provides it; otherwise the list length of the current page is not presented as a total.

Non-goals:
- Do not poll so aggressively that it becomes a new backend feature.
- Do not show another account's cached items.
- Do not render raw HTML from the body.

## Implementation checklist
- [ ] Add the list and mark-read control.
- [ ] Escape text.
- [ ] Clear the query on logout via the existing auth cache clear.

## API and data contract
Uses the inbox routes. Renders title and body as text.

## Acceptance criteria
- [ ] Mark read updates the row after refetch.
- [ ] A 401 sends the user to sign in.
- [ ] Notification text is not injected as HTML.
- [ ] Switching users does not show the previous list.

## Tests and evidence
UI tests for empty, mark read, and text escaping.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #96
- RENT-069 (GitHub #80)
- RENT-014 (GitHub #22)

## Ownership and review
- Planning owner: Member C
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: low
- Tentative estimate: 0.5 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M09`, priority `P1`, risk `low`
- Publication: GitHub issue #84

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

