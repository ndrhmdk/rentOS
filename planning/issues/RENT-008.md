<!-- rentos-task: RENT-008 -->

## Outcome
rental_requests, tenancies, tenancy_contracts, and tenancy_renewal_requests exist with the dictionary constraints. A GiST exclusion constraint prevents overlapping blocked date ranges for the same unit when tenancy status is PENDING_CONFIRMATION, CONFIRMED, or ACTIVE. Adjacent dates are allowed. There is no contract_versions table and no contract_confirmations table.

## References
- Requirement IDs: FR33, FR67, FR86
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR33-AC01, FR33-AC02, FR33-AC03, FR33-AC04, FR33-AC05, FR67-AC01, FR67-AC02, FR67-AC03, FR67-AC04, FR86-AC01, FR86-AC02, FR86-AC03, FR86-AC04, FR86-AC05
- Module: M06
- Rubric IDs: T2a
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M06-*` when that directory exists.

## Current repository evidence
Those tables are absent. docs/07-architecture/data-model.md requires btree_gist, inclusive end converted to exclusive end+1 day, and write-once confirmation columns on tenancy_contracts. phpunit.xml uses sqlite, which cannot prove this constraint. docs/07-architecture/technical-decisions/ADR-002 and ADR-003 are the decision records.

## Scope and non-goals
Enable btree_gist. Store confirmation timestamps on tenancy_contracts. Unique (tenancy_id, version_number). Unique rental_requests acceptance link on tenancies.rental_request_id. One PENDING rental request per tenant/listing. One PENDING renewal per tenancy. Do not UNIQUE tenancy_contracts.renewal_request_id. Composite foreign keys keep contract pointers inside the same tenancy.

Non-goals:
- Do not implement the proposal HTTP action.
- Do not put now() inside the exclusion predicate.
- Do not recreate a global unique(unit_id) allocated rule.
- Do not add contract amendment of an already confirmed row.

## Implementation checklist
- [ ] Write Postgres migrations and the exclusion constraint using a daterange that converts inclusive end to exclusive end.
- [ ] Add the immutability trigger or equivalent that allows the first tenant confirmation or rejection and rejects later term or acknowledgement updates.
- [ ] Add tests for overlap, adjacency, and double confirmation.

## API and data contract
Statuses match the state-transition table. owner_confirmed_at is not null. tenant_confirmed_at and tenant_rejected_at are mutually exclusive. Blocked dates are finite.

## Acceptance criteria
- [ ] Overlapping PENDING_CONFIRMATION and CONFIRMED ranges on one unit fail.
- [ ] A range ending on 30 June and another starting on 1 July commits.
- [ ] Updating monthly_rent after insert fails.
- [ ] A second tenant acknowledgement on the same row fails.
- [ ] SQLite is not used as the proof.

## Tests and evidence
backend/tests/Feature/Database/TenancyExclusionTest.php on the pgsql profile covering overlap, adjacency, and write-once confirmation.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #89
- RENT-007 (GitHub #14)

## Ownership and review
- Planning owner: Member A
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: high
- Tentative estimate: 2 days
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M06`, priority `P0`, risk `high`
- Publication: GitHub issue #16

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

