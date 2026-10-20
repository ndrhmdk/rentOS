<!-- rentos-task: RENT-086 -->

## Outcome
Member D adds the admin queue, detail, and reason-form screenshots into the slots in the root README, plus a short accessibility note for keyboard paging, labels, and focus. The demo script receives the admin timestamps D will perform.

## References
- Requirement IDs: None. This is a course or foundation task.
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: No single FR row. Observable checks are below.
- Module: M08
- Rubric IDs: README, DEMO
- Product priority: course
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M08-*` when that directory exists.

## Current repository evidence
README screenshot slots are created by RENT-080. Admin screens are D's issues. No screenshots exist today.

## Scope and non-goals
Capture the review queue, review decision, report queue, and suspend form. Write a few lines on the accessibility checks already covered by the UI tests. Add demo cues, not a second recording.

Non-goals:
- Do not rewrite the API sections of the README.
- Do not present fixtures as production data in the caption.
- Do not include personal data in screenshots.
- Do not change suspension rules.

## Implementation checklist
- [ ] Capture the four screens from the running app.
- [ ] Fill the README slots and captions.
- [ ] Add the accessibility note and demo cues.

## API and data contract
Images live under a documented docs or README path and show the real admin UI. Captions name the route.

## Acceptance criteria
- [ ] Captions do not say the fixture mode is production.
- [ ] The accessibility note mentions keyboard paging and the reason field.
- [ ] The demo script lists D's segment.

## Tests and evidence
The UI tests from RENT-038 and RENT-066 remain the behavioral evidence. Screenshot review is human.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #96
- RENT-038 (GitHub #54)
- RENT-066 (GitHub #75)
- RENT-080 (GitHub #39)

## Ownership and review
- Planning owner: Member D
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member C
- Risk: low
- Tentative estimate: 0.5 day
- Existing labels to apply: documentation
- Proposed extra labels, not created yet: module `M08`, priority `course`, risk `low`
- Publication: GitHub issue #81

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

