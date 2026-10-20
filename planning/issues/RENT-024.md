<!-- rentos-task: RENT-024 -->

## Outcome
The owner sees thumbnails, can mark selected images, drag or otherwise reorder them, remove one with confirmation, and upload another. A failed upload shows retry and does not claim success.

## References
- Requirement IDs: FR56, FR57
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR56-AC01, FR56-AC02, FR56-AC03, FR56-AC04, FR57-AC01, FR57-AC02, FR57-AC03, FR57-AC04
- Module: M02
- Rubric IDs: T6b
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M02-*` when that directory exists.

## Current repository evidence
No gallery component exists. Upload depends on RENT-022 and RENT-023.

## Scope and non-goals
Gallery panel on the property screen. Use explicit width and height or a sized image component so layout does not jump. Show loading and empty states.

Non-goals:
- Do not show an approval badge for photos.
- Do not implement admin review.
- Do not lazy-load the entire app in this small panel beyond a normal image loading attribute.

## Implementation checklist
- [ ] Build select, reorder, remove, and upload controls.
- [ ] Map 422 and 503 to visible errors.
- [ ] Keep a stable key per media id.

## API and data contract
Uses media routes only. The browser never receives the service role key.

## Acceptance criteria
- [ ] Empty gallery explains that at least one selected photo is needed before submit.
- [ ] Remove asks for confirmation and refetches.
- [ ] A 503 upload shows a retry message and the old gallery remains.
- [ ] Selected state matches the API after reload.

## Tests and evidence
UI test for empty state, remove confirmation, and failed upload. Image sizing is covered again in RENT-078.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #90
- RENT-021 (GitHub #35)
- RENT-023 (GitHub #40)

## Ownership and review
- Planning owner: Member C
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: low
- Tentative estimate: 0.5 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M02`, priority `P0`, risk `low`
- Publication: GitHub issue #43

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

