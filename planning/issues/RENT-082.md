<!-- rentos-task: RENT-082 -->

## Outcome
Member A files an individual self-report for each of the five course sprints, using the lecturer's required format. The reports describe A's own commits, reviews, and issues. They are not replaced by a group summary.

## References
- Requirement IDs: None. This is a course or foundation task.
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: No single FR row. Observable checks are below.
- Module: M10
- Rubric IDs: SELF-A
- Product priority: course
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M10-*` when that directory exists.

## Current repository evidence
No self-report files exist. course-compliance.md says each of four members submits five reports and that a missing report can deduct 10 percent from the group mark. Real sprint dates are not in the repository.

## Scope and non-goals
Add the five reports under a path the lecturer requested, or the submission channel if reports must not live in git. If the channel is external, the README links to the instruction and A records that the files were submitted.

Non-goals:
- Do not write B, C, or D's reports.
- Do not invent sprint dates that the lecturer has not published.
- Do not use one combined document for all members.

## Implementation checklist
- [ ] Obtain the current report template.
- [ ] Write five individual reports as the sprints close.
- [ ] Link or file them where the marker asked.

## API and data contract
Each report names the author as Member A until a real name is required by the template, then the real name. Issue numbers from this backlog are cited only for work A actually did.

## Acceptance criteria
- [ ] Five distinct reports exist or the external submission is recorded.
- [ ] The author is A, not the whole team.
- [ ] They refer to real issue numbers and pull requests A completed.
- [ ] They do not claim unfinished coverage gates.

## Tests and evidence
Reviewer B checks the five files or links. No automated test.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #96

## Ownership and review
- Planning owner: Member A
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: low
- Tentative estimate: 0.5 day
- Existing labels to apply: documentation
- Proposed extra labels, not created yet: module `M10`, priority `course`, risk `low`
- Publication: GitHub issue #5

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

