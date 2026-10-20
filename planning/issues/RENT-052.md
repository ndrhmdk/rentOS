<!-- rentos-task: RENT-052 -->

## Outcome
The owner records move-in on or after the confirmed start, which sets ACTIVE and moved_in_at. Before start, the owner can cancel with a reason, which sets CANCELLED and releases the blocked range. An active tenancy can be ended with a reason and actual end, which sets ENDED, preserves contract rows, and cancels a still-pending renewal request.

## References
- Requirement IDs: FR66, FR80, FR42
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR66-AC01, FR66-AC02, FR66-AC03, FR66-AC04, FR66-AC05, FR80-AC01, FR80-AC02, FR80-AC03, FR80-AC04, FR42-AC01, FR42-AC02, FR42-AC03, FR42-AC04
- Module: M06
- Rubric IDs: None
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M06-*` when that directory exists.

## Current repository evidence
Routes move-in, end, and cancel are in api-design.md and absent. BR14 says contract end is not physical move-out by itself; the end action is the operational record.

## Scope and non-goals
Three owner actions under /api/v1/tenancies/{tenancy}. Lock the tenancy. Require reasons for cancel and end. Serialize pending renewal work in the end transaction.

Non-goals:
- Do not let the tenant set moved_in_at.
- Do not delete contract history.
- Do not auto-retire the unit.
- Do not start a new enquiry.

## Implementation checklist
- [ ] Add the three actions and state guards.
- [ ] Release or finish blocked dates according to the ended actual date.
- [ ] Cancel pending renewal rows when ending.

## API and data contract
Move-in 200 ACTIVE only from CONFIRMED on or after start. 409 before start or from the wrong status. Cancel 200 only before start. End 200 from ACTIVE with end_reason and actual_ended_at. 422 without a reason.

## Acceptance criteria
- [ ] Cancel stores the reason and clears the remaining block.
- [ ] End keeps tenancy_contracts rows.
- [ ] A pending renewal becomes CANCELLED when the tenancy ends.
- [ ] Another owner receives 404.

## Tests and evidence
Feature tests for each guard and the renewal side effect using a pending renewal fixture.

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
- Publication: GitHub issue #76

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

