<!-- rentos-task: RENT-023 -->

## Outcome
An owner can choose which completed images are selected for the listing, change sort order, and soft-remove an image. Removal does not ask for admin review. Replacing a photo uploads a new path and swaps the reference. An approved listing stays approved.

## References
- Requirement IDs: FR56, FR57
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR56-AC01, FR56-AC02, FR56-AC03, FR56-AC04, FR57-AC01, FR57-AC02, FR57-AC03, FR57-AC04
- Module: M02
- Rubric IDs: None
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M02-*` when that directory exists.

## Current repository evidence
property_media columns is_selected_for_listing, sort_order, deleted_at, and revision are specified and not implemented. BR04 forbids an image review workflow.

## Scope and non-goals
PATCH and DELETE /api/v1/properties/{property}/media and a reorder request with expected revisions. Deleted images disappear from gallery reads. Public listing selection is enforced later at publish time.

Non-goals:
- Do not set replaces_image_id.
- Do not reset moderation_status.
- Do not purge Storage bytes in this issue.
- Do not let a tenant reorder the gallery.

## Implementation checklist
- [ ] Add update, reorder, and soft-delete actions.
- [ ] Increment property content_revision when gallery content changes.
- [ ] Reject reorder entries that reference another property.

## API and data contract
PATCH media caption, selection, and sort_order. DELETE sets deleted_at. 409 on stale media revision. 200 returns the gallery ordered by sort_order. Selected images must be completed, non-deleted, and in scope.

## Acceptance criteria
- [ ] Reorder persists and a refetch matches.
- [ ] Soft-deleted image is absent from the owner gallery.
- [ ] Changing photos on an APPROVED listing leaves moderation_status APPROVED.
- [ ] A stranger receives 404.
- [ ] Stale revision returns 409.

## Tests and evidence
Feature tests for reorder, soft delete, approved-listing unchanged status, and stale revision.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #90
- RENT-022 (GitHub #36)

## Ownership and review
- Planning owner: Member B
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: medium
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M02`, priority `P0`, risk `medium`
- Publication: GitHub issue #40

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

