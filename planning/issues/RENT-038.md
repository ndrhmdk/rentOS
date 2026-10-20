<!-- rentos-task: RENT-038 -->

## Outcome
The admin review queue, detail, and decision form have a fixture set and UI tests that a reviewer can run. The tests cover empty, loading, error, forbidden, stale revision, and required reason. They count toward the frontend coverage gate.

## References
- Requirement IDs: FR13, FR14, FR15
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR13-AC01, FR13-AC02, FR13-AC03, FR14-AC01, FR14-AC02, FR14-AC03, FR14-AC04, FR15-AC01, FR15-AC02, FR15-AC03
- Module: M08
- Rubric IDs: T3g
- Product priority: course
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M08-*` when that directory exists.

## Current repository evidence
No frontend test runner or test script is configured in the current frontend/package.json. RENT-004 must establish the base test command. Individual screens add their own tests; this issue assembles the fixture pack and fills gaps.

## Scope and non-goals
Shared fixtures for pending, stale, empty, and forbidden payloads. One test file per screen if not already added. Document how to run them in frontend/README.md.

Non-goals:
- Do not claim coverage is already above 70 percent.
- Do not test the SQL lock here.
- Do not replace API tests owned by RENT-032.

## Implementation checklist
- [ ] Add the fixtures.
- [ ] Fill any missing state tests.
- [ ] Document the command.

## API and data contract
Fixtures match the RENT-032 DTO field names. Tests fail if a required column header or reason label disappears.

## Acceptance criteria
- [ ] The documented command runs the admin review UI tests.
- [ ] Empty, error, 403, stale detail, and blank reason are each asserted.
- [ ] Fixtures contain no real personal phone numbers.
- [ ] The issue text does not say the coverage threshold is already met.

## Tests and evidence
The UI tests added here are the deliverable. Record the command output in the pull request when they are run; do not invent a pass in the issue.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #91
- RENT-035 (GitHub #26)
- RENT-036 (GitHub #29)
- RENT-037 (GitHub #48)

## Ownership and review
- Planning owner: Member D
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: low
- Tentative estimate: 0.5 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M08`, priority `course`, risk `low`
- Publication: GitHub issue #54

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

