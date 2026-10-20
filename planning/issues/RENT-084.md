<!-- rentos-task: RENT-084 -->

## Outcome
Member C files an individual self-report for each of the five course sprints. The reports cover C's frontend flows, favourites, and the UI coverage work.

## References
- Requirement IDs: None. This is a course or foundation task.
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: No single FR row. Observable checks are below.
- Module: M10
- Rubric IDs: SELF-C
- Product priority: course
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M10-*` when that directory exists.

## Current repository evidence
No reports exist. C is the tenant and frontend planning alias. No GitHub handle is mapped.

## Scope and non-goals
Five individual reports in the lecturer's format.

Non-goals:
- Do not write the admin UI reports for D.
- Do not claim the coverage percentage before RENT-077 has a report.
- Do not invent dates.

## Implementation checklist
- [ ] Use the lecturer template.
- [ ] Cite C's screens and tests.
- [ ] File all five.

## API and data contract
Author is Member C or the later real name.

## Acceptance criteria
- [ ] Five reports are filed.
- [ ] They describe C's UI work.
- [ ] Coverage claims match an attached report if they mention a percentage.
- [ ] They are individual.

## Tests and evidence
Reviewer A checks the five submissions. No automated test.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #96

## Ownership and review
- Planning owner: Member C
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: low
- Tentative estimate: 0.5 day
- Existing labels to apply: documentation
- Proposed extra labels, not created yet: module `M10`, priority `course`, risk `low`
- Publication: GitHub issue #7

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

