<!-- rentos-task: RENT-048 -->

## Outcome
The owner submits one proposal for a pending enquiry. In one transaction the system inserts an immutable tenancy_contracts row, sets owner_confirmed_at, creates the tenancy in PENDING_CONFIRMATION with a blocked range and a configurable confirmation deadline, and sets the enquiry to ACCEPTED. Overlap with another blocked range fails and rolls everything back. There is no separate accept route and no contract_versions table.

## References
- Requirement IDs: FR30, FR33, FR34, FR42, FR67, FR75, FR86
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR30-AC01, FR30-AC02, FR30-AC03, FR30-AC04, FR33-AC01, FR33-AC02, FR33-AC03, FR33-AC04, FR33-AC05, FR34-AC01, FR34-AC02, FR34-AC03, FR34-AC04, FR34-AC05, FR42-AC01, FR42-AC02, FR42-AC03, FR42-AC04, FR67-AC01, FR67-AC02, FR67-AC03, FR67-AC04, FR75-AC01, FR75-AC02, FR75-AC03, FR75-AC04, FR86-AC01, FR86-AC02, FR86-AC03, FR86-AC04, FR86-AC05
- Module: M06
- Rubric IDs: T4d
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M06-*` when that directory exists.

## Current repository evidence
Proposal route is specified and absent. Exclusion constraint is RENT-008. Lock order in BR10 is property, then unit ids, then request and tenancy. The 48 hour deadline is a proposed default in config, not a hard-coded teacher constant.

## Scope and non-goals
POST /api/v1/rental-requests/{request}/tenancy-proposal. Body includes unit, dates, monthly_rent, deposit_amount, policies_snapshot, private document reference and hash, optional signed_on, owner acknowledgement true, expected revisions, and client_operation_id. Minimum original term is 3 months. Rent > 0 and deposit >= 0. Deadline comes from config tenancy.confirmation_hours default 48.

Non-goals:
- Do not let the client send owner_confirmed_at.
- Do not accept the enquiry without the contract insert.
- Do not confirm the tenant in this action.
- Do not release the hold on notification failure.
- Do not use sqlite as the overlap proof.

## Implementation checklist
- [ ] Implement the single transaction and lock order.
- [ ] Stage the private document through the storage approach in RENT-050's contract, storing path and hash only after the object exists.
- [ ] Map exclusion violations to 409.
- [ ] Write audit and outbox intent in the same transaction without depending on the worker to commit.

## API and data contract
201 with tenancy and contract ids. Enquiry ACCEPTED. Tenancy PENDING_CONFIRMATION. 409 on overlap, stale revision, or idempotency hash clash. 422 on term, money, or missing acknowledgement. 404 for another owner's enquiry. Notification failure after commit does not revert the tenancy.

## Acceptance criteria
- [ ] Overlap rolls back the enquiry to PENDING.
- [ ] Missing acknowledgement returns 422.
- [ ] A second proposal for the same accepted enquiry returns 409.
- [ ] Adjacent ranges both commit.
- [ ] A forced outbox failure after commit is not required; a test shows the business rows remain if a post-commit hook throws.

## Tests and evidence
Postgres feature tests for success, overlap rollback, adjacency, and idempotent replay. These are the core race tests for this action.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #93
- RENT-046 (GitHub #58)
- RENT-026 (GitHub #37)
- RENT-017 (GitHub #25)

## Ownership and review
- Planning owner: Member A
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: high
- Tentative estimate: 2 days
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M06`, priority `P0`, risk `high`
- Publication: GitHub issue #66

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

