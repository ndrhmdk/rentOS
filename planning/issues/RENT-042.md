<!-- rentos-task: RENT-042 -->

## Outcome
A signed-in user can PUT a property into favourite_properties and DELETE it. The first save returns 201 and a repeat returns 200 with one row. DELETE returns 204 even when repeated or when the listing is no longer public. The list returns full cards only for currently visible properties and generic placeholders otherwise. The count includes placeholders.

## References
- Requirement IDs: FR88
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR88-AC01, FR88-AC02, FR88-AC03, FR88-AC04, FR88-AC05, FR88-AC06, FR88-AC07, FR88-AC08, FR88-AC09, FR88-AC10
- Module: M04
- Rubric IDs: T4a
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M04-*` when that directory exists.

## Current repository evidence
No favourite route exists. The table is RENT-010. FR88-AC01 through AC10 are specified. A repository search found no favourite implementation. Guests are not given a server-side anonymous save.

## Scope and non-goals
GET /api/v1/me/favourite-properties, GET .../ids, PUT and DELETE .../{property}. Actor from JWT. PUT checks the property currently has a visible listing. Placeholders omit title, photos, address, and suspension reason. Cache-Control private, no-store. No queue.

Non-goals:
- Do not add a toggle route.
- Do not key by listing or unit.
- Do not create a rental request.
- Do not reserve a unit.
- Do not return hidden content to the owner of the favourite.
- Do not block save on date unavailability when the listing is still public.

## Implementation checklist
- [ ] Add controller, policy, and resources for card versus placeholder.
- [ ] Enforce the unique pair and map it to 200 on replay.
- [ ] Cap the ids endpoint.
- [ ] Exclude foreign users' rows.

## API and data contract
PUT 201 or 200. DELETE 204. GET list paginated with saved_count including placeholders. Ids endpoint returns only property UUIDs for the caller, capped. 401 for guests. 404 when PUT targets a property that is not currently publicly visible. 404 on DELETE is not used for a missing pair; DELETE stays 204.

## Acceptance criteria
- [ ] Two PUTs leave one row, 201 then 200.
- [ ] Another user cannot read the row.
- [ ] A suspended saved property becomes a placeholder without title or photo.
- [ ] DELETE twice returns 204 and one removal.
- [ ] A public listing with zero units free on the requested dates can still be saved.
- [ ] Response headers are private.

## Tests and evidence
Postgres feature tests for unique race, privacy, placeholder, idempotent delete, and the available-but-full-dates case. Cover FR88-AC02 through AC08 and AC10 at the API. AC05 and AC09 are UI tests in RENT-043.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #92
- RENT-010 (GitHub #18)
- RENT-016 (GitHub #23)
- RENT-033 (GitHub #47)

## Ownership and review
- Planning owner: Member B
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: high
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M04`, priority `P0`, risk `high`
- Publication: GitHub issue #51

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

