<!-- rentos-task: RENT-033 -->

## Outcome
The owner publishes a listing only when it is initially approved, complete, and not admin-suspended. Publish sets publication_status PUBLISHED. Hide sets HIDDEN and does not withdraw approval. Archive sets archived_at on the listing. Editing the property cannot clear suspension. Admin restore is not this route.

## References
- Requirement IDs: FR17, FR18
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR17-AC01, FR17-AC02, FR17-AC03, FR17-AC04, FR18-AC01, FR18-AC02, FR18-AC03
- Module: M03
- Rubric IDs: None
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M03-*` when that directory exists.

## Current repository evidence
publication_status and admin_suspended_at are dictionary fields with no writer. BR03 says suspension blocks public routes and owner publishing.

## Scope and non-goals
POST /api/v1/listings/{listing}/publish, /hide, and archive. Publish rechecks completeness and admin_suspended_at under a property/listing lock. Hide and archive do not change moderation_status.

Non-goals:
- Do not infer hide from an accepted enquiry.
- Do not republish when an admin later restores; restore is RENT-061.
- Do not change unit availability.
- Do not expose the listing on the public search route until RENT-039.

## Implementation checklist
- [ ] Add the three owner actions.
- [ ] Block publish when suspended, incomplete, or not APPROVED.
- [ ] Keep HIDDEN distinct from suspended.

## API and data contract
Publish 200 only from approved unsuspended complete listings. 409 otherwise, with a machine code such as listing_suspended or listing_not_approved. Hide 200 from PUBLISHED. Archive 200 and the listing is no longer current.

## Acceptance criteria
- [ ] Approved complete unsuspended listing publishes.
- [ ] Suspended approved listing returns 409 and stays unpublished.
- [ ] Owner edit of the title while suspended leaves admin_suspended_at set.
- [ ] Hide keeps APPROVED and sets HIDDEN.
- [ ] Archive excludes the listing from the owner's current listing lookup.

## Tests and evidence
Feature tests for publish guards, hide, and the owner-edit-does-not-clear-suspension case.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #91
- RENT-032 (GitHub #46)

## Ownership and review
- Planning owner: Member B
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: high
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M03`, priority `P0`, risk `high`
- Publication: GitHub issue #47

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

