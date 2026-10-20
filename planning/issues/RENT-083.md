<!-- rentos-task: RENT-083 -->

## Outcome
Member B files an individual self-report for each of the five course sprints. The reports cover B's property, listing, search, storage, and report-backend work and are separate from the group README.

## References
- Requirement IDs: None. This is a course or foundation task.
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: No single FR row. Observable checks are below.
- Module: M10
- Rubric IDs: SELF-B
- Product priority: course
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M10-*` when that directory exists.

## Current repository evidence
No per-member reports are in the repository. The deduction rule is in course-compliance.md. Handles are not verified, so the planning author remains Member B until the team maps a person.

## Scope and non-goals
Five individual reports in the lecturer's format, filed by B.

Non-goals:
- Do not file A's tenancy reports.
- Do not invent dates.
- Do not submit a single group PDF.

## Implementation checklist
- [ ] Use the lecturer template.
- [ ] Cite B's issues and pull requests.
- [ ] File all five.

## API and data contract
Author is Member B or the later real name. Content matches merged work.

## Acceptance criteria
- [ ] Five reports are filed.
- [ ] They are written as B.
- [ ] They cite real pull requests.
- [ ] They are not copies of A's reports.

## Tests and evidence
Reviewer A checks the five submissions. No automated test.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #96

## Ownership and review
- Planning owner: Member B
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: low
- Tentative estimate: 0.5 day
- Existing labels to apply: documentation
- Proposed extra labels, not created yet: module `M10`, priority `course`, risk `low`
- Publication: GitHub issue #6

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

