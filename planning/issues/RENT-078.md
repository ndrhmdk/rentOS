<!-- rentos-task: RENT-078 -->

## Outcome
Listing photos and heavy client code are loaded in a way the team can measure. The pull request shows a before and after note for image transfer or JavaScript on the listing detail route, using the browser tools, and the images have explicit sizes so the layout stays stable.

## References
- Requirement IDs: None. This is a course or foundation task.
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: No single FR row. Observable checks are below.
- Module: M04
- Rubric IDs: T6b
- Product priority: course
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M04-*` when that directory exists.

## Current repository evidence
frontend/ now exists as a Next.js scaffold, but there is still no listing detail page, no measured before/after loading evidence, and no documented bundle analysis path. T6b asks for measurable evidence once listing screens exist.

## Scope and non-goals
Use the Next.js image component or an equivalent sized loader for gallery and listing photos. Split a heavy client-only widget if one exists. Capture one before/after measurement on a throttled profile and store the note.

Non-goals:
- Do not claim an improvement without numbers from a real run.
- Do not lazy-load the legal text of a contract into a public page.
- Do not add a map library.
- Do not optimize admin tables that have no image weight.

## Implementation checklist
- [ ] Size the listing images.
- [ ] Record the measurement note.
- [ ] Keep the detail route usable with images disabled.

## API and data contract
Public image URLs are the gallery URLs already authorized for published listings. The measurement note lists the route, viewport, and the two numbers.

## Acceptance criteria
- [ ] The note contains two comparable figures from an actual run.
- [ ] A broken image still shows the listing text.
- [ ] No service-role URL is used as the image source.

## Tests and evidence
UI test that the image element has width and height or a sized component. The performance numbers are human evidence, not a unit assertion.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #96
- RENT-040 (GitHub #55)
- RENT-024 (GitHub #43)

## Ownership and review
- Planning owner: Member C
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: medium
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M04`, priority `course`, risk `medium`
- Publication: GitHub issue #64

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

