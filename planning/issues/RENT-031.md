<!-- rentos-task: RENT-031 -->

## Outcome
The owner submits a complete draft or rejected listing for first review. The action stores the listing revision and property content_revision being reviewed, sets moderation_status PENDING, and leaves publication_status unchanged. An incomplete package is rejected with field errors.

## References
- Requirement IDs: FR12
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR12-AC01, FR12-AC02, FR12-AC03, FR12-AC04
- Module: M03
- Rubric IDs: None
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M03-*` when that directory exists.

## Current repository evidence
WF-04 is unimplemented. Completeness rules in the dictionary require address, description, unit facts, selected cover, and marketed complete units before publication; submission captures that package.

## Scope and non-goals
POST /api/v1/listings/{listing}/submit with expected_revision and expected_content_revision. Validate required property, unit, media, and policy presence. Do not approve or publish.

Non-goals:
- Do not auto-approve.
- Do not hide the listing.
- Do not open a second review after APPROVED.
- Do not create a separate submission table unless the revision columns already on listings are insufficient; prefer submitted_revision and submitted_content_revision columns from the dictionary.

## Implementation checklist
- [ ] Add the submit action and completeness validator.
- [ ] Persist the snapshot revisions.
- [ ] Reject submit when status is PENDING or APPROVED.

## API and data contract
200 or 409. Status becomes PENDING. 422 lists missing cover, address, or unit fields. Stale content revision returns 409.

## Acceptance criteria
- [ ] A complete draft becomes PENDING and records both revisions.
- [ ] Missing cover returns 422 and stays DRAFT.
- [ ] Submit on APPROVED returns 409.
- [ ] Two concurrent submits result in one PENDING row and one 409.

## Tests and evidence
Feature tests for completeness, double submit, and stale content revision.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #91
- RENT-030 (GitHub #33)
- RENT-023 (GitHub #40)
- RENT-026 (GitHub #37)
- RENT-027 (GitHub #38)

## Ownership and review
- Planning owner: Member B
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: high
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M03`, priority `P0`, risk `high`
- Publication: GitHub issue #45

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

