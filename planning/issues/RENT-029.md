<!-- rentos-task: RENT-029 -->

## Outcome
Successful creates and updates of properties, units, media selection, policies, and amenities write one audit_logs row in the same transaction. The row stores actor, entity, action, a minimal before/after, and the request correlation id. Failures roll back the audit with the business write.

## References
- Requirement IDs: FR55
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR55-AC01, FR55-AC02, FR55-AC03, FR55-AC04
- Module: M02
- Rubric IDs: None
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M02-*` when that directory exists.

## Current repository evidence
audit_logs is specified. No listener writes it. BR16 requires same-transaction audit for successful mutations.

## Scope and non-goals
Call a shared audit writer from the inventory mutations already built. Do not log secrets or full image bytes. System jobs can pass a null actor later.

Non-goals:
- Do not build an audit browsing UI.
- Do not write audit on failed validation.
- Do not use the audit table as a queue.
- Do not omit the rollback test.

## Implementation checklist
- [ ] Add the writer and use it in property, unit, media, policy, and amenity updates.
- [ ] Include correlation id from RENT-017.
- [ ] Test rollback.

## API and data contract
audit_logs insert in the same DB transaction. before_values and after_values omit storage service keys. action names are allowlisted strings such as property.updated.

## Acceptance criteria
- [ ] A property rename writes one audit row that commits with the new name.
- [ ] A forced failure after the audit insert leaves neither the rename nor the audit row.
- [ ] A 422 validation does not write audit.
- [ ] The actor matches the token subject.

## Tests and evidence
Feature test with a thrown exception after audit insert to prove rollback, plus one happy-path assertion.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #90
- RENT-009 (GitHub #17)
- RENT-018 (GitHub #28)
- RENT-020 (GitHub #32)
- RENT-026 (GitHub #37)
- RENT-027 (GitHub #38)

## Ownership and review
- Planning owner: Member B
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: medium
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M02`, priority `P0`, risk `medium`
- Publication: GitHub issue #42

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

