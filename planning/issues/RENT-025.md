<!-- rentos-task: RENT-025 -->

## Outcome
A scheduled job deletes Storage objects only after the media row is soft-deleted or the upload was never referenced, the retention window has passed, and no listing cover or contract path points at the object. The row records purged_at only after Storage confirms deletion.

## References
- Requirement IDs: FR59
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR59-AC01, FR59-AC02, FR59-AC03, FR59-AC04
- Module: M02
- Rubric IDs: T3f
- Product priority: P1
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M02-*` when that directory exists.

## Current repository evidence
No command or job deletes media. FR59 is P1 and is required for safe Storage use. Queue bootstrap is RENT-067.

## Scope and non-goals
Artisan command scheduled daily. It selects eligible property_media rows, calls Storage DELETE, and sets purged_at. A Storage failure leaves purged_at null and logs a redacted error. It retries on the next run.

Non-goals:
- Do not delete a selected or cover image.
- Do not delete contract documents.
- Do not hard-delete the media row if audit history needs the hash.
- Do not run the purge inside the user's HTTP request.

## Implementation checklist
- [ ] Add the command and schedule entry.
- [ ] Guard cover_media_id and selected rows.
- [ ] Test Storage failure and success with HTTP fakes.

## API and data contract
Job is idempotent. Second run skips rows with purged_at set. 404 from Storage for an already-gone object can set purged_at. Other errors do not.

## Acceptance criteria
- [ ] A soft-deleted image past retention is removed and purged_at is set.
- [ ] A cover image is skipped.
- [ ] Storage 500 leaves purged_at null.
- [ ] Running the command twice does not call delete again for a purged row.

## Tests and evidence
Job test with HTTP fake and frozen time for the retention window.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #90
- RENT-023 (GitHub #40)
- RENT-067 (GitHub #10)

## Ownership and review
- Planning owner: Member B
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: medium
- Tentative estimate: 0.5 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M02`, priority `P1`, risk `medium`
- Publication: GitHub issue #44

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

