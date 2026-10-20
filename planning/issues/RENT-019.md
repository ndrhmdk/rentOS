<!-- rentos-task: RENT-019 -->

## Outcome
From the owner home, a user can create a property draft and edit name, type, arrangement, address, and description. Saving shows field errors from the API. Archive asks for confirmation and then removes the card from the active list.

## References
- Requirement IDs: FR07, FR08
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR07-AC01, FR07-AC02, FR07-AC03, FR07-AC04, FR08-AC01, FR08-AC02, FR08-AC03, FR08-AC04
- Module: M02
- Rubric IDs: None
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M02-*` when that directory exists.

## Current repository evidence
No property form exists in frontend/. The API does not exist until RENT-018. design/ui-ux-guidelines.md is the visual source.

## Scope and non-goals
Routes /app/owner/properties and /app/owner/properties/[id]. Forms post to the RENT-018 contract. Loading, empty, and error states are visible. client_operation_id is generated once per submit attempt and reused on retry of the same payload.

Non-goals:
- Do not edit units, photos, or listings here.
- Do not show a moderation badge.
- Do not allow editing admin suspension, because the property has none.

## Implementation checklist
- [ ] Build list, create, and edit screens.
- [ ] Map 422 fields and 409 conflict to visible messages.
- [ ] Confirm archive in the UI and refetch.

## API and data contract
Uses RENT-018 routes only. The UI does not send owner_id or is_admin.

## Acceptance criteria
- [ ] A successful create navigates to the edit screen.
- [ ] Invalid type shows the API field error.
- [ ] Archive removes the card after refetch.
- [ ] The empty list explains how to create the first property.
- [ ] A 404 shows a not-found state.

## Tests and evidence
UI tests for empty list, validation display, and archive confirmation with a mocked API.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #90
- RENT-015 (GitHub #24)
- RENT-018 (GitHub #28)

## Ownership and review
- Planning owner: Member C
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: low
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M02`, priority `P0`, risk `low`
- Publication: GitHub issue #31

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

