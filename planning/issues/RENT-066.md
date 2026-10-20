<!-- rentos-task: RENT-066 -->

## Outcome
Member D has a fixture pack and UI tests for the report queue, detail, decision form, and suspend form. The tests cover empty, error, forbidden, required reason, and the restore-does-not-publish display. They are part of D's assessable work.

## References
- Requirement IDs: FR39, FR78
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR39-AC01, FR39-AC02, FR39-AC03, FR39-AC04, FR78-AC01, FR78-AC02, FR78-AC03, FR78-AC04, FR78-AC05
- Module: M08
- Rubric IDs: T3g
- Product priority: course
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M08-*` when that directory exists.

## Current repository evidence
Screen tests may already exist from the previous D issues. This issue closes gaps and documents the command. No coverage percentage is claimed.

## Scope and non-goals
Fixtures and any missing tests. README section for the admin UI test command.

Non-goals:
- Do not claim the 70 percent gate.
- Do not move API race tests into the UI suite.
- Do not test Telescope.

## Implementation checklist
- [ ] Add missing state tests.
- [ ] Keep fixtures free of real personal data.
- [ ] Document the command.

## API and data contract
Fixtures match admin DTO names from RENT-061, including the split between internal notes and public summary.

## Acceptance criteria
- [ ] Required-reason and restore display are asserted.
- [ ] A 403 queue fixture is included.
- [ ] The pull request lists the test files.

## Tests and evidence
The new or completed UI tests are the artifact. Do not paste a fake coverage number.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #95
- RENT-062 (GitHub #27)
- RENT-063 (GitHub #30)
- RENT-064 (GitHub #67)
- RENT-065 (GitHub #68)

## Ownership and review
- Planning owner: Member D
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: low
- Tentative estimate: 0.5 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M08`, priority `course`, risk `low`
- Publication: GitHub issue #75

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

