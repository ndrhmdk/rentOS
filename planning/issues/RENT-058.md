<!-- rentos-task: RENT-058 -->

## Outcome
The tenant can ask to renew from the tenancy page, withdraw that request, and confirm the renewal contract when the owner has proposed one. The owner can reject the request or submit the renewal proposal. The screen says the current end date stays until both sides confirm the new segment.

## References
- Requirement IDs: FR68, FR69, FR70
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR68-AC01, FR68-AC02, FR68-AC03, FR68-AC04, FR69-AC01, FR69-AC02, FR69-AC03, FR69-AC04, FR70-AC01, FR70-AC02, FR70-AC03, FR70-AC04, FR70-AC05, FR70-AC06
- Module: M07
- Rubric IDs: None
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M07-*` when that directory exists.

## Current repository evidence
No renewal UI exists. APIs are RENT-056 and RENT-057.

## Scope and non-goals
Panels on the tenancy page for request, owner proposal, withdraw, and reject. Reuse the confirm control for the renewal contract UUID.

Non-goals:
- Do not show the current stay as ended.
- Do not edit the original contract.
- Do not add a second timeline page.

## Implementation checklist
- [ ] Add the request form and owner proposal form.
- [ ] Show the unchanged current end beside the proposed end.
- [ ] Handle 409 overlap.

## API and data contract
Uses the renewal routes and the existing confirm route. Displays server dates rather than computing the legal end in the browser.

## Acceptance criteria
- [ ] Owner proposal shows the new contract awaiting confirm.
- [ ] Overlap 409 is visible and the old end remains.
- [ ] Withdraw returns the request to a closed state.
- [ ] Empty state explains that no renewal has been asked.

## Tests and evidence
UI tests for request success, overlap error, and the unchanged current end label.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #94
- RENT-051 (GitHub #78)
- RENT-056 (GitHub #82)
- RENT-057 (GitHub #85)

## Ownership and review
- Planning owner: Member C
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: medium
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M07`, priority `P0`, risk `medium`
- Publication: GitHub issue #86

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

