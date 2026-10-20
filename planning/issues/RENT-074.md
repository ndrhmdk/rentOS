<!-- rentos-task: RENT-074 -->

## Outcome
Queries slower than a configured threshold emit a deduplicated alert that names the SQL fingerprint and duration. Showing the query in Telescope is not the alert. A deliberately slow statement in a local command proves the path.

## References
- Requirement IDs: FR48
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR48-AC01, FR48-AC02, FR48-AC03
- Module: M10
- Rubric IDs: T5c
- Product priority: P1
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M10-*` when that directory exists.

## Current repository evidence
No DB::listen alert exists. T5c requires a threshold rule and a delivered alert. The open question about the host does not remove the need for a demonstrable local alert.

## Scope and non-goals
Listen for slow queries, fingerprint them, and send them through the same deduped reporter as RENT-073. Default threshold is configurable, with a demo value low enough to trigger the sample. Do not enable a threshold that alerts on every small query during normal tests unless the test sets it.

Non-goals:
- Do not call a Telescope screen the alert.
- Do not log bound parameter values that may be personal data; log the fingerprint and duration.
- Do not tune production indexes in this issue beyond what the sample needs.

## Implementation checklist
- [ ] Add the listener and threshold config.
- [ ] Dedupe by fingerprint.
- [ ] Add an artisan command that runs a slow statement and records the alert artifact.

## API and data contract
Alert includes fingerprint, duration_ms, and correlation id when a request is active. It omits raw bindings. Threshold is env SLOW_QUERY_MS.

## Acceptance criteria
- [ ] A repeat inside the window does not create a second alert.
- [ ] A fast query does not alert.
- [ ] The artifact is producible by the documented command.

## Tests and evidence
A test that registers the listener with a tiny threshold and asserts one deduped alert. The demo command is documented for the human evidence.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #96
- RENT-072 (GitHub #11)
- RENT-039 (GitHub #50)

## Ownership and review
- Planning owner: Member A
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: medium
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M10`, priority `P1`, risk `medium`
- Publication: GitHub issue #57

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

