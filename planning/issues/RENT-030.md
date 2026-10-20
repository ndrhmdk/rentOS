<!-- rentos-task: RENT-030 -->

## Outcome
An owner creates one current listing draft for a property and can edit its title, description, and cover after approval without returning the listing to PENDING. The first approval remains the only content review. A second non-archived listing for the same property is rejected.

## References
- Requirement IDs: FR10, FR11
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR10-AC01, FR10-AC02, FR10-AC03, FR10-AC04, FR11-AC01, FR11-AC02, FR11-AC03, FR11-AC04
- Module: M03
- Rubric IDs: T4a
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M03-*` when that directory exists.

## Current repository evidence
No listing controller exists. BR02 says later valid edits stay approved and are audited. The unique listing index arrives in RENT-007.

## Scope and non-goals
POST and PATCH /api/v1/properties/{property}/listing. If moderation_status is APPROVED, a valid edit keeps APPROVED and increments content and listing revisions. DRAFT and REJECTED edits stay in those states. Cover media must be a selected, non-deleted, same-property image when supplied.

Non-goals:
- Do not submit for review here.
- Do not publish.
- Do not introduce CHANGES_REQUESTED.
- Do not review the property or the photos as their own queue.

## Implementation checklist
- [ ] Add the listing resource actions.
- [ ] Branch edit behavior on moderation_status.
- [ ] Reject a second active listing.
- [ ] Write audit via RENT-029's writer when that issue has landed; call the same helper if merged first.

## API and data contract
POST 201 DRAFT/DRAFT. PATCH expected_revision. 409 if another non-archived listing exists or revision is stale. 422 if cover media is out of scope. Approved edit response still says APPROVED.

## Acceptance criteria
- [ ] Create returns one draft.
- [ ] A second create returns 409.
- [ ] Editing an approved listing keeps APPROVED.
- [ ] Editing a draft keeps DRAFT.
- [ ] Another owner receives 404.

## Tests and evidence
Feature tests for the unique listing and the approved-edit path. FR11 race with a stale admin approval is completed in RENT-032.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #91
- RENT-018 (GitHub #28)

## Ownership and review
- Planning owner: Member B
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: medium
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M03`, priority `P0`, risk `medium`
- Publication: GitHub issue #33

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

