<!-- rentos-task: RENT-022 -->

## Outcome
An owner completes an image upload into Supabase Storage. Laravel records property_media only after it has fetched the object, checked the decoded image type and size, and stored sha256. A failed Storage call is logged with status and correlation id and returns 503. Bytes are not trusted from the file extension.

## References
- Requirement IDs: FR09
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR09-AC01, FR09-AC02, FR09-AC03, FR09-AC04
- Module: M02
- Rubric IDs: T3f
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M02-*` when that directory exists.

## Current repository evidence
No media controller exists. config/filesystems.php has no proven Supabase Storage integration path. T3f requires a real external Storage API integration, error handling, and tests.

## Scope and non-goals
POST /api/v1/properties/{property}/media accepts a completed storage path issued by the server, or a server-side upload of the validated bytes. Record mime_type, size_bytes, sha256, and storage_path. Optional unit_id must belong to the same property. Private contract buckets are out of this route.

Non-goals:
- Do not add an image moderation state.
- Do not overwrite an existing storage_path.
- Do not expose the service role key to Next.js.
- Do not treat the SDK import alone as done if the HTTP call is not tested.

## Implementation checklist
- [ ] Issue a server-authorized upload target and confirm the object.
- [ ] Validate magic bytes and size limits.
- [ ] Log Storage failures without secrets.
- [ ] Reject a unit_id from another property.

## API and data contract
POST 201 with media id. 422 for non-image or oversize. 403 for another owner's property. 503 when Storage is unavailable, with no partial media row. storage_path is unique.

## Acceptance criteria
- [ ] A valid image creates one media row and the stored hash matches the bytes.
- [ ] A renamed text file with an image extension is rejected.
- [ ] Storage 500 leaves no media row and writes a redacted log.
- [ ] Cross-property unit_id returns 422 or 403.
- [ ] The service role is absent from the Next.js env example.

## Tests and evidence
HTTP-faked Storage tests for success, invalid bytes, and 503. This is the T3f evidence path.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #90
- RENT-005 (GitHub #4)
- RENT-020 (GitHub #32)

## Ownership and review
- Planning owner: Member B
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: high
- Tentative estimate: 1.5 days
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M02`, priority `P0`, risk `high`
- Publication: GitHub issue #36

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

