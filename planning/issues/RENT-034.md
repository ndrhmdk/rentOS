<!-- rentos-task: RENT-034 -->

## Outcome
The owner can create the listing draft, see why submit is blocked, submit for first review, and later publish, hide, or archive. After approval, the edit form says further edits do not ask for review again. A suspended listing shows that the owner cannot publish or clear the suspension.

## References
- Requirement IDs: FR10, FR11, FR12, FR17, FR18
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR10-AC01, FR10-AC02, FR10-AC03, FR10-AC04, FR11-AC01, FR11-AC02, FR11-AC03, FR11-AC04, FR12-AC01, FR12-AC02, FR12-AC03, FR12-AC04, FR17-AC01, FR17-AC02, FR17-AC03, FR17-AC04, FR18-AC01, FR18-AC02, FR18-AC03
- Module: M03
- Rubric IDs: None
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M03-*` when that directory exists.

## Current repository evidence
No listing wizard exists. APIs are split across RENT-030, RENT-031, and RENT-033 on purpose.

## Scope and non-goals
Screens on the property page for draft, pending, rejected, approved, published, hidden, and suspended banners. Buttons call the matching route. Rejected reason from the admin is shown to the owner.

Non-goals:
- Do not combine create property, units, and publish into one submit.
- Do not add an owner unsuspend button.
- Do not show the admin queue.

## Implementation checklist
- [ ] Add the listing panel and status banners.
- [ ] Disable submit until the client has seen the completeness payload, while still showing server 422s.
- [ ] Show suspension as a restriction the owner cannot clear.

## API and data contract
Uses the owner listing routes only. expected_revision is sent. No admin approve call from this UI.

## Acceptance criteria
- [ ] Owner can move a complete draft to a pending banner.
- [ ] Publish is unavailable until the status is approved and unsuspended.
- [ ] Hide changes the banner to hidden.
- [ ] A 409 suspension error is visible.
- [ ] The screen does not offer changes-requested.

## Tests and evidence
UI tests for the pending, suspended, and rejected banners using mocked listing payloads.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #91
- RENT-024 (GitHub #43)
- RENT-028 (GitHub #41)
- RENT-030 (GitHub #33)
- RENT-031 (GitHub #45)
- RENT-033 (GitHub #47)

## Ownership and review
- Planning owner: Member C
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: medium
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M03`, priority `P0`, risk `medium`
- Publication: GitHub issue #49

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

