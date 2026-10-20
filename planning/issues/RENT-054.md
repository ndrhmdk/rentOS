<!-- rentos-task: RENT-054 -->

## Outcome
A scheduled command finds tenancies still PENDING_CONFIRMATION whose confirmation_expires_at is due, sets EXPIRED, and clears the blocked range. It does not use now() inside the exclusion predicate. A confirm that races the job results in one committed outcome. The default deadline remains the configurable 48 hours used at proposal time.

## References
- Requirement IDs: FR83
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR83-AC01, FR83-AC02, FR83-AC03, FR83-AC04, FR83-AC05
- Module: M06
- Rubric IDs: T6a
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M06-*` when that directory exists.

## Current repository evidence
No scheduler command exists for expiry. FR83 and BR11 describe the reap. Queue bootstrap is RENT-067.

## Scope and non-goals
Artisan command and schedule entry. Lock each due tenancy. Skip rows already confirmed or already expired. Write audit with a null or system actor. Safe to run twice.

Non-goals:
- Do not expire based on created_at alone.
- Do not reject the enquiry again if it is already ACCEPTED; the enquiry stays ACCEPTED and the tenancy expires.
- Do not change the configured hours in a hidden constant.
- Do not delete the contract row.

## Implementation checklist
- [ ] Add the command and a clock abstraction.
- [ ] Lock and compare status.
- [ ] Test double run and a confirm race.

## API and data contract
Due rows become EXPIRED and blocked dates become empty. Not-due rows are unchanged. Second run changes nothing. A row confirmed before the lock is not expired.

## Acceptance criteria
- [ ] A future deadline is left pending.
- [ ] Running twice does not write a second expiry transition.
- [ ] A row that confirms inside the lock stays CONFIRMED.
- [ ] The test sets the deadline explicitly rather than sleeping 48 hours.

## Tests and evidence
Postgres tests with frozen time and two concurrent transactions for the race, plus an idempotent second run.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #93
- RENT-048 (GitHub #66)
- RENT-067 (GitHub #10)

## Ownership and review
- Planning owner: Member A
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: high
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M06`, priority `P0`, risk `high`
- Publication: GitHub issue #71

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

