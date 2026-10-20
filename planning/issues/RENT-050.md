<!-- rentos-task: RENT-050 -->

## Outcome
A party to the tenancy can request a short-lived download for that contract's private object. Laravel authorizes the party before it talks to Storage. Other users receive 404. The object path cannot be overwritten by a later upload.

## References
- Requirement IDs: FR35, FR67
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR35-AC01, FR35-AC02, FR35-AC03, FR35-AC04, FR67-AC01, FR67-AC02, FR67-AC03, FR67-AC04
- Module: M06
- Rubric IDs: T3f
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M06-*` when that directory exists.

## Current repository evidence
document_path and document_sha256 are dictionary fields. No download route exists. Storage errors are patterned in RENT-022.

## Scope and non-goals
GET /api/v1/tenancy-contracts/{contract}/document returns a short-lived URL or a streamed response after authorization. Log Storage failures without the signed URL. Verify the stored sha256 when the bytes are read through Laravel.

Non-goals:
- Do not put the service role in the browser.
- Do not allow a public bucket for contracts.
- Do not authorize from a document id alone without the party check.
- Do not replace the bytes in place.

## Implementation checklist
- [ ] Add the authorized download action.
- [ ] Use a private bucket prefix distinct from gallery images.
- [ ] Test stranger, party, and Storage failure.

## API and data contract
200 for owner or tenant party. 404 for everyone else. 503 if Storage fails, with correlation id. The URL expires. Response does not include the service key.

## Acceptance criteria
- [ ] Another user receives 404.
- [ ] A Storage error returns 503 and no URL with a key.
- [ ] Uploading a new gallery image does not change document_path.

## Tests and evidence
Feature tests with HTTP fakes for success and Storage failure, plus the stranger case.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #93
- RENT-022 (GitHub #36)
- RENT-048 (GitHub #66)

## Ownership and review
- Planning owner: Member B
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: high
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M06`, priority `P0`, risk `high`
- Publication: GitHub issue #70

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

