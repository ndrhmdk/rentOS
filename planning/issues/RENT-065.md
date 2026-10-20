<!-- rentos-task: RENT-065 -->

## Outcome
From the report detail, an admin can suspend or restore the related listing with a required reason. The screen states that restore does not publish the listing and that the owner cannot clear a suspension. The form posts the listing revision and refetches.

## References
- Requirement IDs: FR78
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR78-AC01, FR78-AC02, FR78-AC03, FR78-AC04, FR78-AC05
- Module: M08
- Rubric IDs: None
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M08-*` when that directory exists.

## Current repository evidence
Suspend and restore routes are RENT-061. D renders the form only.

## Scope and non-goals
A distinct form from the report decision form so the two actions are not confused. Show current suspension state from the payload.

Non-goals:
- Do not implement the policy.
- Do not add an owner-facing unsuspend.
- Do not republish in the client after restore.
- Do not hide the reason field.

## Implementation checklist
- [ ] Add suspend and restore forms.
- [ ] Require a reason.
- [ ] Show the resulting publication and suspension flags from the response.

## API and data contract
POST suspend and restore with expected listing revision and reason. The UI displays publication_status and admin_suspended_at from the response.

## Acceptance criteria
- [ ] Restore shows suspension cleared and does not flip a hidden listing to published in the UI's local model.
- [ ] Blank reason blocks submit.
- [ ] 409 shows reload.
- [ ] Helper text says the owner cannot clear suspension.

## Tests and evidence
UI tests for suspend success, restore leaving HIDDEN, and blank reason.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #95
- RENT-063 (GitHub #30)
- RENT-061 (GitHub #60)

## Ownership and review
- Planning owner: Member D
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: medium
- Tentative estimate: 0.5 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M08`, priority `P0`, risk `medium`
- Publication: GitHub issue #68

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

