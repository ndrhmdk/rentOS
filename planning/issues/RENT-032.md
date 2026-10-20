<!-- rentos-task: RENT-032 -->

## Outcome
An admin can list pending first-review packages and approve or reject the exact submitted revisions. Approval sets moderation_status APPROVED and does not publish. Rejection requires a reason, sets REJECTED, and stores the reason. If the property content revision moved after submit, the decision returns 409 and does not approve.

## References
- Requirement IDs: FR13, FR14, FR15
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR13-AC01, FR13-AC02, FR13-AC03, FR14-AC01, FR14-AC02, FR14-AC03, FR14-AC04, FR15-AC01, FR15-AC02, FR15-AC03
- Module: M03
- Rubric IDs: None
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M03-*` when that directory exists.

## Current repository evidence
No admin listing routes exist. BR02 says a stale initial approval must fail. Suspension is a different action in RENT-061. Member D will render the queue only after this contract exists, using fixtures beforehand.

## Scope and non-goals
GET /api/v1/admin/listing-submissions with pagination and status filter. POST approve and POST reject. Both require is_admin and expected listing plus content revisions. Lock the listing and property rows. Write audit in the same transaction.

Non-goals:
- Do not let the owner call these routes.
- Do not clear admin_suspended_at.
- Do not add CHANGES_REQUESTED.
- Do not build the Next.js table in this issue.
- Do not let a non-admin who can see a fixture be considered authorized.

## Implementation checklist
- [ ] Add admin controller, policy, and reason validation.
- [ ] Compare stored submitted revisions with current revisions.
- [ ] Paginate the queue.
- [ ] Return a DTO the admin UI can render without owner phone numbers beyond the public property fields needed for review.

## API and data contract
GET 200 paginated items with listing id, title, owner display name, submitted revisions, and current revisions. POST approve 200 APPROVED. POST reject 200 REJECTED with reason. 422 if reject reason is blank. 409 if revisions differ or status is not PENDING. 403 for non-admin.

## Acceptance criteria
- [ ] Admin approves a matching pending package and publication_status stays DRAFT.
- [ ] Reject without reason returns 422.
- [ ] Content edited after submit causes 409 and status stays PENDING.
- [ ] A second admin decision on the same revision returns 409.
- [ ] Owner calling approve returns 403.
- [ ] Non-admin list returns 403.

## Tests and evidence
Postgres feature tests with two admins and an owner edit between submit and approve. Cover FR13, FR14, and FR15 cases.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #91
- RENT-031 (GitHub #45)
- RENT-016 (GitHub #23)

## Ownership and review
- Planning owner: Member B
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: high
- Tentative estimate: 1.5 days
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M03`, priority `P0`, risk `high`
- Publication: GitHub issue #46

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

