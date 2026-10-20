<!-- rentos-task: RENT-043 -->

## Outcome
A signed-in user can heart a listing card or detail, see a private count, and open a paginated saved list. A guest who hearts is sent to sign in and nothing is queued. The client writes the intended saved state per property in order and refetches if responses arrive out of order. A failed request restores the server state.

## References
- Requirement IDs: FR88
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR88-AC01, FR88-AC02, FR88-AC03, FR88-AC04, FR88-AC05, FR88-AC06, FR88-AC07, FR88-AC08, FR88-AC09, FR88-AC10
- Module: M04
- Rubric IDs: T3e
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M04-*` when that directory exists.

## Current repository evidence
No heart component exists. The API contract is RENT-042. BR17 through BR19 apply. The public listing cache must not be the source of the heart.

## Scope and non-goals
Heart on cards and detail, badge from the private list count, and /app/tenant/favourites. Hydrate hearts from GET .../ids. Placeholder rows show a generic unavailable label and a remove button.

Non-goals:
- Do not toggle through one endpoint.
- Do not remember a guest heart and replay it after login.
- Do not show hidden titles.
- Do not mark a heart as success while the request is failing.

## Implementation checklist
- [ ] Add the heart, badge, and list.
- [ ] Serialize writes per property id.
- [ ] On failure, refetch and show retry.
- [ ] Clear hearts when the auth cache clears.

## API and data contract
PUT to save and DELETE to remove. The component's desired state is the last user action, reconciled to the last completed response or a refetch. Ids request is private.

## Acceptance criteria
- [ ] Guest click opens sign-in and the ids request is not sent.
- [ ] Out-of-order save then remove test ends on the later intent.
- [ ] Network failure returns the heart to the refetched state and shows retry.
- [ ] A placeholder has no title, photo, or address and can be removed.
- [ ] Switching accounts does not show the previous hearts.

## Tests and evidence
UI tests for guest redirect, failure rollback, placeholder, and serialized intents. Use a mocked API that can resolve out of order.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #92
- RENT-014 (GitHub #22)
- RENT-040 (GitHub #55)
- RENT-042 (GitHub #51)

## Ownership and review
- Planning owner: Member C
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: medium
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M04`, priority `P0`, risk `medium`
- Publication: GitHub issue #61

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

