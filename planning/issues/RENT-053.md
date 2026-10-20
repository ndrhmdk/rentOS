<!-- rentos-task: RENT-053 -->

## Outcome
While the tenancy is AWAITING_REVISION, the owner submits a new immutable contract row with the next version number. The new row has a fresh owner acknowledgement and an empty tenant acknowledgement. The tenancy returns to PENDING_CONFIRMATION only if the new dates can be reserved. The previous declined row stays stored and unchanged.

## References
- Requirement IDs: FR71, FR82, FR42
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR71-AC01, FR71-AC02, FR71-AC03, FR71-AC04, FR82-AC01, FR82-AC02, FR82-AC03, FR82-AC04, FR82-AC05, FR42-AC01, FR42-AC02, FR42-AC03, FR42-AC04
- Module: M06
- Rubric IDs: None
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M06-*` when that directory exists.

## Current repository evidence
WF-11 and the state table describe this transition. No correction route exists. renewal_request_id must remain non-unique for later renewal corrections too.

## Scope and non-goals
POST /api/v1/tenancies/{tenancy}/contract-proposals for an original correction. supersedes_contract_id points at the declined current row. Reacquire the blocked range inside the transaction. Conflict leaves the tenancy in AWAITING_REVISION.

Non-goals:
- Do not edit the declined row's rent.
- Do not reuse the old tenant confirmation.
- Do not confirm automatically.
- Do not use this route for a renewal segment; that is RENT-057.

## Implementation checklist
- [ ] Insert the next version and move the pending pointer.
- [ ] Re-check exclusion.
- [ ] Keep the prior row readable in the timeline.

## API and data contract
201 with the new contract id and PENDING_CONFIRMATION. 409 if dates overlap or status is not AWAITING_REVISION. 422 for invalid money or term. Old tenant_rejected_at remains set on the old row.

## Acceptance criteria
- [ ] The declined row is unchanged.
- [ ] Overlap returns 409 and status stays AWAITING_REVISION.
- [ ] Tenant must confirm the new UUID, which is asserted by a null tenant_confirmed_at.
- [ ] Timeline data includes both rows.

## Tests and evidence
Postgres tests for the new version, unchanged old row, and failed reacquire.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #93
- RENT-049 (GitHub #69)

## Ownership and review
- Planning owner: Member A
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: high
- Tentative estimate: 1.5 days
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M06`, priority `P0`, risk `high`
- Publication: GitHub issue #77

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

