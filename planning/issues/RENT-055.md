<!-- rentos-task: RENT-055 -->

## Outcome
A daily command considers PENDING enquiries whose age is at least 15 days. It rejects one only when no marketed READY unit on that listing can cover the stored desired interval, including alternatives to the preferred unit. If any full-interval alternative exists, the enquiry stays PENDING. A hidden listing is not treated as proof that the dates are occupied.

## References
- Requirement IDs: FR85
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR85-AC01, FR85-AC02, FR85-AC03, FR85-AC04, FR85-AC05, FR85-AC06, FR85-AC07, FR85-AC08
- Module: M05
- Rubric IDs: T6a
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M05-*` when that directory exists.

## Current repository evidence
availability_checked_at exists in the dictionary and is unused. BR12 and FR85 define the rule. Search eligibility is RENT-039. No command exists.

## Scope and non-goals
Scheduled command. Lock the request. Reuse the eligibility query for the stored dates. Set REJECTED, outcome_reason, closed_at, and availability_checked_at. Do not reject on age alone.

Non-goals:
- Do not reject at 15 days when another unit is free.
- Do not treat preferred_unit_id as mandatory.
- Do not change ACCEPTED rows.
- Do not infer occupation from publication_status HIDDEN.

## Implementation checklist
- [ ] Add the command using the shared eligibility service.
- [ ] Test alternative unit, preferred unit taken, hidden listing, and under-age rows.
- [ ] Make the 15 day threshold configurable with default 15.

## API and data contract
Only PENDING rows at or past the age threshold are candidates. Rejection reason states that no unit covers the stored interval. Rows with an alternative stay PENDING and still update availability_checked_at.

## Acceptance criteria
- [ ] Age 15 with no covering unit becomes REJECTED.
- [ ] Age 14 stays PENDING.
- [ ] A hidden listing does not force rejection when the dates are free on a visible comparison inside the same property's units that remain marketed; if the listing itself is hidden, skip rejection rather than treating hide as occupation.
- [ ] A second run does not reject an already rejected row.

## Tests and evidence
Postgres tests for the eight FR85 situations that the command owns: under-age, alternative exists, no alternative, preferred unit busy, hidden listing, already terminal, and a repeated run.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #93
- RENT-044 (GitHub #52)
- RENT-039 (GitHub #50)
- RENT-067 (GitHub #10)

## Ownership and review
- Planning owner: Member B
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: high
- Tentative estimate: 1.5 days
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M05`, priority `P0`, risk `high`
- Publication: GitHub issue #59

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

