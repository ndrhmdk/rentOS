<!-- rentos-task: RENT-017 -->

## Outcome
Mutating requests that create domain rows accept client_operation_id and a payload hash scoped to the actor. The same key and same hash returns the original result. The same key with a different hash returns 409. Stale expected_revision returns 409. Errors share one JSON shape with a correlation id and no secrets.

## References
- Requirement IDs: FR74
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR74-AC01, FR74-AC02, FR74-AC03, FR74-AC04
- Module: M10
- Rubric IDs: T4a
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M10-*` when that directory exists.

## Current repository evidence
No idempotency table or exception renderer exists. api-design.md defines 401, 403, 404, 409, 422, 429, and 503. FR74 requires this before proposal retries.

## Scope and non-goals
Add idempotency_keys table (actor_id, operation, client_operation_id, payload_hash, response snapshot). Add an exception renderer. Provide a trait later actions must use. Pagination helper documents page, per_page max 50.

Non-goals:
- Do not make a UUID by itself an authorization proof.
- Do not apply idempotency to GET.
- Do not swallow 500s into 200.
- Do not build every domain action in this issue.

## Implementation checklist
- [ ] Add the table, trait, and renderer.
- [ ] Cover replay, hash mismatch, and stale revision on a small probe command.
- [ ] Document the header or body field name expected_revision.

## API and data contract
client_operation_id is a UUID in the JSON body. expected_revision is an integer. Error JSON has error.code, error.message, error.fields, and correlation_id. 422 lists field errors.

## Acceptance criteria
- [ ] Replay with the same hash returns the stored status and body.
- [ ] Same key and different hash returns 409.
- [ ] Stale revision returns 409.
- [ ] A validation error is 422 with field messages and a correlation id.
- [ ] The response snapshot does not store Authorization headers.

## Tests and evidence
Feature tests for the probe action covering FR74-AC01 through FR74-AC04.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #89
- RENT-016 (GitHub #23)

## Ownership and review
- Planning owner: Member A
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: high
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M10`, priority `P0`, risk `high`
- Publication: GitHub issue #25

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

