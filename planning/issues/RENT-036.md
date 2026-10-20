<!-- rentos-task: RENT-036 -->

## Outcome
From a queue row, the admin opens a detail view of the submitted package: title, description, address, selected images, unit summaries, and effective policies. The view shows the submitted revisions and warns when current revisions differ. It does not decide the review.

## References
- Requirement IDs: FR13
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR13-AC01, FR13-AC02, FR13-AC03
- Module: M08
- Rubric IDs: None
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M08-*` when that directory exists.

## Current repository evidence
The queue is RENT-035. Detail fields come from the admin DTO in RENT-032. No detail page exists.

## Scope and non-goals
Route /app/admin/listing-submissions/[id]. Fixture detail until the API exists, then the real GET. Image alt text uses the caption or a generic label. No private tenant contacts.

Non-goals:
- Do not approve from this issue.
- Do not show other tenants' enquiries.
- Do not edit the listing.
- Do not display internal report notes.

## Implementation checklist
- [ ] Build the detail layout and the stale-revision warning.
- [ ] Handle 404.
- [ ] Keep actions as links or disabled placeholders until RENT-037.

## API and data contract
Reads one submission DTO. Displays submitted_revision, submitted_content_revision, and current revisions. Does not send a decision.

## Acceptance criteria
- [ ] A fixture detail renders title, one unit, and one policy.
- [ ] When current content revision differs, a warning is visible.
- [ ] 404 shows not found.
- [ ] No approve request is fired while viewing.

## Tests and evidence
UI tests for the stale warning, 404, and the absence of a decision request.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #91
- RENT-035 (GitHub #26)

## Ownership and review
- Planning owner: Member D
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: low
- Tentative estimate: 0.5 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M08`, priority `P0`, risk `low`
- Publication: GitHub issue #29

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

