<!-- rentos-task: RENT-077 -->

## Outcome
The frontend test suite, including Member D's admin tests and the tenant flows, reports coverage strictly above 70 percent for the UI and business logic it is configured to measure. The report is separate from the API figure.

## References
- Requirement IDs: None. This is a course or foundation task.
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: No single FR row. Observable checks are below.
- Module: M10
- Rubric IDs: T3g
- Product priority: course
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M10-*` when that directory exists.

## Current repository evidence
The current frontend/package.json has no test or coverage script yet. RENT-004 introduces the runner baseline. No coverage report exists. T3g is a full-mark requirement and is not waived by product priority.

## Scope and non-goals
Configure the runner and coverage. Include admin fixtures from D and the search, favourite, enquiry, and tenancy screens. Attach the report. Fill gaps the report shows.

Non-goals:
- Do not mix this percentage with the PHP report.
- Do not exclude the admin screens D wrote.
- Do not claim the gate from a single screenshot test.
- Do not lower the threshold.

## Implementation checklist
- [ ] Add the coverage script.
- [ ] Run the combined UI suite.
- [ ] Add missing business-state tests the report identifies.

## API and data contract
The pull request names the tool, include paths, and percentage. Admin test files are part of the run.

## Acceptance criteria
- [ ] D's admin test paths are included.
- [ ] A favourite failure case and an enquiry pending case are in the run.
- [ ] The number is not invented in this issue text.

## Tests and evidence
The coverage artifact is the evidence, produced when the suite is run.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #96
- RENT-043 (GitHub #61)
- RENT-045 (GitHub #62)
- RENT-051 (GitHub #78)
- RENT-038 (GitHub #54)
- RENT-066 (GitHub #75)

## Ownership and review
- Planning owner: Member C
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: high
- Tentative estimate: 2 days
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M10`, priority `course`, risk `high`
- Publication: GitHub issue #83

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

