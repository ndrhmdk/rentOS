<!-- rentos-task: RENT-076 -->

## Outcome
The Laravel API and action test suite reports line coverage strictly above 70 percent for the application code under test, using Postgres for exclusion and authorization races. The report is attached to the pull request. Existing example tests are not deleted to inflate the number, and untested framework scaffolding is excluded only with an explicit phpunit coverage filter that a reviewer can see.

## References
- Requirement IDs: FR75
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR75-AC01, FR75-AC02, FR75-AC03, FR75-AC04
- Module: M10
- Rubric IDs: T4d
- Product priority: course
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M10-*` when that directory exists.

## Current repository evidence
backend/tests contains ExampleTest unit and feature tests only. phpunit.xml uses sqlite. No coverage report exists. T4d requires strictly greater than 70 percent.

## Scope and non-goals
Add a coverage script and CI artifact. Fill gaps the report shows in policies, commands, and controllers that earlier issues left thin. Keep race tests on the pgsql profile.

Non-goals:
- Do not lower the threshold to the achieved number.
- Do not count frontend tests toward this API figure.
- Do not mark the issue done from a sqlite-only run of the exclusion tests.
- Do not delete domain code to raise coverage.

## Implementation checklist
- [ ] Add the coverage command and filter.
- [ ] Run it and attach the summary in the pull request.
- [ ] Add tests only for real gaps the report names.

## API and data contract
The reported figure is for backend application code. The pull request quotes the tool and the percentage. Postgres race tests are listed by file name.

## Acceptance criteria
- [ ] The filter path is visible in phpunit or the coverage script.
- [ ] At least one overlap test and one admin authorization test are in the run.
- [ ] The issue is not closed from a claim without the report.

## Tests and evidence
The coverage run is the evidence. Do not write the percentage into this issue body in advance.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #96
- RENT-048 (GitHub #66)
- RENT-039 (GitHub #50)
- RENT-061 (GitHub #60)
- RENT-012 (GitHub #15)

## Ownership and review
- Planning owner: Member A
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: high
- Tentative estimate: 2 days
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M10`, priority `course`, risk `high`
- Publication: GitHub issue #73

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

