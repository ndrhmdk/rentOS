<!-- rentos-task: RENT-051 -->

## Outcome
Owner and tenant open a tenancy and see each immutable contract version, the effective confirmed span, and the pending version if any. The tenant can confirm or decline the current version. Decline asks for a reason. The screen identifies the contract UUID it is acting on.

## References
- Requirement IDs: FR35, FR71, FR81
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR35-AC01, FR35-AC02, FR35-AC03, FR35-AC04, FR71-AC01, FR71-AC02, FR71-AC03, FR71-AC04, FR81-AC01, FR81-AC02, FR81-AC03, FR81-AC04, FR81-AC05, FR81-AC06
- Module: M06
- Rubric IDs: T3e
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M06-*` when that directory exists.

## Current repository evidence
No tenancy page exists. GET /api/v1/tenancies/{tenancy} is part of RENT-049. Confirm and reject are RENT-049. Download is RENT-050.

## Scope and non-goals
Route /app/tenancies/[id] for both parties. Render versions in order, hash prefix, status, and document download link. Confirm and decline forms call RENT-049. Show the deadline timestamp from the server.

Non-goals:
- Do not let the UI mark confirmed before the API returns.
- Do not edit historical rent.
- Do not show unrelated tenancies.
- Do not implement the correction composer here.

## Implementation checklist
- [ ] Add the timeline UI.
- [ ] Call confirm and reject with the contract id and hash from the payload.
- [ ] Show 409 after the deadline.
- [ ] Link the private download only for parties.

## API and data contract
Reads GET /api/v1/tenancies/{tenancy} from RENT-049. The client sends contract id, document_sha256, and expected_revision. It does not send confirmation timestamps.

## Acceptance criteria
- [ ] A stranger id shows not found.
- [ ] Confirm shows the server CONFIRMED state after refetch.
- [ ] Decline requires a reason.
- [ ] A 409 deadline message is visible.
- [ ] Historical versions do not show a confirm button.

## Tests and evidence
UI tests for timeline, not-found, confirm body, and blank decline reason. API authorization for the GET stays in RENT-049.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #93
- RENT-049 (GitHub #69)
- RENT-050 (GitHub #70)

## Ownership and review
- Planning owner: Member C
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: medium
- Tentative estimate: 1.5 days
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M06`, priority `P0`, risk `medium`
- Publication: GitHub issue #78

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

