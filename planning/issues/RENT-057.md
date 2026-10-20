<!-- rentos-task: RENT-057 -->

## Outcome
The owner proposes a renewal contract whose start is the day after the current confirmed end and whose end matches the request. The blocked envelope grows to cover the extension, while the current confirmed occupancy stays in place. The renewal request remains PENDING until the tenant confirms that new contract. Several unconfirmed correction rows may share the renewal request id.

## References
- Requirement IDs: FR70, FR84, FR42
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR70-AC01, FR70-AC02, FR70-AC03, FR70-AC04, FR70-AC05, FR70-AC06, FR84-AC01, FR84-AC02, FR84-AC03, FR84-AC04, FR42-AC01, FR42-AC02, FR42-AC03, FR42-AC04
- Module: M07
- Rubric IDs: T4d
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M07-*` when that directory exists.

## Current repository evidence
WF-13 and BR13 describe consecutive segments. The exclusion constraint must see the extended blocked range. No renewal proposal route exists.

## Scope and non-goals
POST /api/v1/tenancy-renewal-requests/{renewal}/contract-proposals. Insert type RENEWAL, basis_contract_id of the latest confirmed contract, and a non-unique renewal_request_id. Extend blocked_end_date inside the same transaction. Tenant confirmation reuses RENT-049 against the new contract UUID and then sets the renewal ACCEPTED and promotes the confirmed span. If RENT-049 is written only for original contracts, extend it here for the renewal type.

Non-goals:
- Do not change the current segment's rent when the proposal is created.
- Do not UNIQUE renewal_request_id.
- Do not drop the current occupancy to 'make room' for the extension.
- Do not mark the request ACCEPTED before tenant confirmation.

## Implementation checklist
- [ ] Insert the renewal version and extend the blocked envelope.
- [ ] Allow a later correction row for the same renewal request.
- [ ] On tenant confirm of that UUID, promote the confirmed end and set the request ACCEPTED.
- [ ] On withdraw or owner reject of an unconfirmed extension, shrink the blocked envelope back to the confirmed span.

## API and data contract
201 PENDING tenancy confirmation, request still PENDING. 409 if the extension overlaps another tenancy. Confirm of the renewal contract 200 with request ACCEPTED and confirmed_end_date updated. Withdraw before confirm releases only the unconfirmed extension.

## Acceptance criteria
- [ ] The extension overlap returns 409 and does not change confirmed rent.
- [ ] Two unconfirmed renewal versions can share one renewal_request_id.
- [ ] Tenant confirm of the new hash promotes the span.
- [ ] Withdraw releases the extension and leaves the original confirmed end.

## Tests and evidence
Postgres tests for envelope growth, overlap, shared renewal_request_id, confirm promotion, and withdraw release.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #94
- RENT-056 (GitHub #82)
- RENT-048 (GitHub #66)

## Ownership and review
- Planning owner: Member A
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: high
- Tentative estimate: 2 days
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M07`, priority `P0`, risk `high`
- Publication: GitHub issue #85

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

