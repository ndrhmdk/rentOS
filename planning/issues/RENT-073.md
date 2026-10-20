<!-- rentos-task: RENT-073 -->

## Outcome
Unhandled API exceptions return a friendly JSON error with a correlation id and write a structured log line. A critical report path delivers one deduplicated alert the team can show. The alert contains the correlation id and exception class, not secrets or request bodies.

## References
- Requirement IDs: FR47
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR47-AC01, FR47-AC02, FR47-AC03
- Module: M10
- Rubric IDs: T5b
- Product priority: P1
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M10-*` when that directory exists.

## Current repository evidence
config/logging.php is the framework default. No exception renderer or alert transport exists. T5b asks for an actual critical alert, not only a log line.

## Scope and non-goals
JSON exception rendering aligned with RENT-017. A log channel with structured context. A critical notifier with a simple dedupe key so the same exception class and route do not send unbounded repeats during the demo window. The notifier can be a logged mail, a webhook to a free inbox, or a file the demo opens; the pull request must show one real delivered artifact.

Non-goals:
- Do not page a paid on-call product.
- Do not put tokens in the alert.
- Do not replace 422 validation with a critical alert.
- Do not claim an alert was sent without the artifact.

## Implementation checklist
- [ ] Add the renderer and log context.
- [ ] Add the critical reporter and dedupe.
- [ ] Capture one sample alert in the pull request evidence folder or describe the inbox used, without secrets.

## API and data contract
500 responses use the shared error schema. Validation stays 422 and does not alert. Alert payload has correlation_id, exception class, and route name.

## Acceptance criteria
- [ ] A forced 500 returns the friendly JSON and a log line with the same correlation id.
- [ ] Two identical critical failures inside the dedupe window produce one alert artifact.
- [ ] The artifact has no Authorization value.
- [ ] A 422 does not create that alert.

## Tests and evidence
Feature test for the 500 shape and a unit test for dedupe. The delivered artifact is attached by the implementer when the test run happens.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #96
- RENT-005 (GitHub #4)

## Ownership and review
- Planning owner: Member A
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: medium
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M10`, priority `P1`, risk `medium`
- Publication: GitHub issue #12

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

