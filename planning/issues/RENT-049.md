<!-- rentos-task: RENT-049 -->

## Outcome
The tenant confirms one contract by its UUID and document hash before the deadline. Confirmation sets tenant_confirmed_at once and moves the tenancy to CONFIRMED. Decline requires a reason, sets tenant_rejected_at once, moves the tenancy to AWAITING_REVISION, and clears the pending hold. The same row cannot be both confirmed and rejected. After the deadline, confirm fails.

## References
- Requirement IDs: FR81, FR82, FR86
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR81-AC01, FR81-AC02, FR81-AC03, FR81-AC04, FR81-AC05, FR81-AC06, FR82-AC01, FR82-AC02, FR82-AC03, FR82-AC04, FR82-AC05, FR86-AC01, FR86-AC02, FR86-AC03, FR86-AC04, FR86-AC05
- Module: M06
- Rubric IDs: T4d
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M06-*` when that directory exists.

## Current repository evidence
Confirm and reject routes are in api-design.md and absent. Write-once columns are RENT-008. State table lists PENDING_CONFIRMATION to CONFIRMED or AWAITING_REVISION.

## Scope and non-goals
POST /api/v1/tenancy-contracts/{contract}/confirm and /reject. Also add GET /api/v1/tenancies/{tenancy} for the owner and tenant, returning versions, hashes, deadline, and the effective confirmed span. Match document_sha256 and expected tenancy revision. Only the enquiry tenant can confirm or reject. Lock tenancy and contract. Do not update rent or dates.

Non-goals:
- Do not confirm a different version than the pending pointer.
- Do not let the owner call tenant confirm.
- Do not extend the deadline in the client.
- Do not create the replacement contract in this issue.

## Implementation checklist
- [ ] Add both actions and the hold release on decline.
- [ ] Reject late confirmation.
- [ ] Prove write-once with a second call.

## API and data contract
Confirm 200 CONFIRMED. Reject 200 AWAITING_REVISION and blocked dates cleared. 409 when hash mismatches, deadline has passed, or the row is already acknowledged. 422 when reject reason is blank. 403 for the owner or another tenant.

## Acceptance criteria
- [ ] Wrong hash returns 409 and leaves the row unconfirmed.
- [ ] Second confirm returns 409.
- [ ] Decline clears the blocked range so another proposal can use those dates.
- [ ] A clock at the deadline fails confirm.
- [ ] Owner receives 403.
- [ ] The tenancy GET returns versions to the owner and tenant and 404 to a stranger.

## Tests and evidence
Postgres tests with frozen time for the deadline, hash mismatch, double acknowledgement, and the party GET.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #93
- RENT-048 (GitHub #66)

## Ownership and review
- Planning owner: Member A
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: high
- Tentative estimate: 2 days
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M06`, priority `P0`, risk `high`
- Publication: GitHub issue #69

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

