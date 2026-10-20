<!-- rentos-task: RENT-040 -->

## Outcome
A guest can search by text and dates, open a listing, and see only the units that qualified. The page shows advertised policies, amenity labels, photos, and prices. A direct link to a missing listing shows an unavailable page. Enquiry entry is a link to the form owned by RENT-045.

## References
- Requirement IDs: FR19, FR21
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR19-AC01, FR19-AC02, FR19-AC03, FR19-AC04, FR21-AC01, FR21-AC02, FR21-AC03, FR21-AC04
- Module: M04
- Rubric IDs: T3e, T6b
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M04-*` when that directory exists.

## Current repository evidence
No search page exists. The public DTO is RENT-039. design/ holds the visual rules.

## Scope and non-goals
Routes /listings and /listings/[id]. URL query holds filters. Shared and in-unit amenities are labeled differently. Images use sized rendering. Loading, empty, and error states exist.

Non-goals:
- Do not embed a map.
- Do not show contract documents.
- Do not save a favourite in this issue.
- Do not display another prospect's phone.

## Implementation checklist
- [ ] Build filter form, result cards, and detail.
- [ ] Read dates from the query string.
- [ ] Render the API empty state when count would be zero.
- [ ] Show the default minimum-term label when dates are absent.

## API and data contract
Calls GET /api/v1/listings and the detail route. Does not send an actor id. 404 renders unavailable without dumping the error body if it contains extra fields.

## Acceptance criteria
- [ ] A two-unit payload shows only the returned unit cards.
- [ ] Empty results show an empty state.
- [ ] Suspended id shows unavailable.
- [ ] Amenity sections are split into shared and in-unit.
- [ ] Refreshing the URL restores the filters.

## Tests and evidence
UI tests for results, empty, unavailable, and amenity grouping using a mocked API.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #92
- RENT-004 (GitHub #3)
- RENT-039 (GitHub #50)

## Ownership and review
- Planning owner: Member C
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: medium
- Tentative estimate: 1.5 days
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M04`, priority `P0`, risk `medium`
- Publication: GitHub issue #55

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

