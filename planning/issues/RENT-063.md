<!-- rentos-task: RENT-063 -->

## Outcome
The admin opens one report and reads the description, listing summary, status, and internal notes. The reporter-facing summary is visually separate from internal notes so a later form does not copy notes into the public outcome by accident.

## References
- Requirement IDs: FR39
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR39-AC01, FR39-AC02, FR39-AC03, FR39-AC04
- Module: M08
- Rubric IDs: None
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M08-*` when that directory exists.

## Current repository evidence
Detail depends on the queue and the RENT-061 DTO. No page exists.

## Scope and non-goals
Route /app/admin/reports/[id]. Show internal notes only on this admin page. 404 state. No decision yet.

Non-goals:
- Do not resolve the report.
- Do not put internal notes into a reporter preview as if they were public.
- Do not edit the listing title.

## Implementation checklist
- [ ] Build the detail sections.
- [ ] Label internal notes as admin-only.
- [ ] Handle 404.

## API and data contract
Reads one admin report DTO including internal_notes. Does not POST.

## Acceptance criteria
- [ ] Internal notes render in an admin-only region.
- [ ] A reporter outcome field is visibly separate.
- [ ] 404 renders not found.
- [ ] The page does not send a decision request on load.

## Tests and evidence
UI test for the two text regions and 404.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #95
- RENT-062 (GitHub #27)

## Ownership and review
- Planning owner: Member D
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: low
- Tentative estimate: 0.5 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M08`, priority `P0`, risk `low`
- Publication: GitHub issue #30

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

