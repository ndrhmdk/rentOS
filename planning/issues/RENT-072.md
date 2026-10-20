<!-- rentos-task: RENT-072 -->

## Outcome
Laravel Telescope records requests, queries, and jobs in the local and demo environment. The UI is not public. Entries can be shown during the course demo as evidence of a request, a query, and a job.

## References
- Requirement IDs: FR48
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR48-AC01, FR48-AC02, FR48-AC03
- Module: M10
- Rubric IDs: T5a
- Product priority: P1
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M10-*` when that directory exists.

## Current repository evidence
composer.json has no laravel/telescope. T5a requires it. The app is Laravel 13, so the installed Telescope release must match that major version.

## Scope and non-goals
Install Telescope, migrate its tables, and gate the UI with an admin or local-only check. Disable it in any environment that would expose tokens. Filter Authorization headers out of recorded request headers.

Non-goals:
- Do not leave Telescope open on a public URL.
- Do not record the service role key.
- Do not treat Telescope watch as the slow-query alert.
- Do not install it on a production project the team does not have.

## Implementation checklist
- [ ] Install and gate Telescope.
- [ ] Hide authorization headers.
- [ ] Document the demo click-path.

## API and data contract
Only an admin or a local environment can open /telescope. Recorded headers exclude Authorization and apikey.

## Acceptance criteria
- [ ] A sample request appears in Telescope.
- [ ] The Authorization header is absent from the recorded request.
- [ ] An unauthenticated browser receives 403 on /telescope when not in the allowed local configuration.
- [ ] A queued job entry is visible after RENT-067's worker runs a job.

## Tests and evidence
Feature test for the gate and a header-hiding assertion. Do not claim the demo has already been recorded.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #96
- RENT-005 (GitHub #4)

## Ownership and review
- Planning owner: Member A
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: medium
- Tentative estimate: 0.5 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M10`, priority `P1`, risk `medium`
- Publication: GitHub issue #11

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

