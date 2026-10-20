<!-- rentos-task: RENT-039 -->

## Outcome
Guests can search published, approved, unsuspended, non-archived listings. A listing is returned only when one unit satisfies every active filter and the whole requested interval. Counts and rent ranges come from that same query. Pending-confirmation holds block dates. Adjacent tenancies do not. Without dates, each unit is tested from today for its minimum term.

## References
- Requirement IDs: FR19, FR20, FR40, FR77
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR19-AC01, FR19-AC02, FR19-AC03, FR19-AC04, FR20-AC01, FR20-AC02, FR20-AC03, FR20-AC04, FR40-AC01, FR40-AC02, FR40-AC03, FR77-AC01, FR77-AC02, FR77-AC03, FR77-AC04
- Module: M04
- Rubric IDs: T3e, T4a
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M04-*` when that directory exists.

## Current repository evidence
No listing search route exists. api-design.md specifies GET /api/v1/listings and GET /api/v1/listings/{listing}. BR09 and FR77 define eligibility. SQLite cannot prove the range logic that must match the exclusion constraint.

## Scope and non-goals
Public read-only resource. Filters: text, district, dates, price, area, unit kind, occupants, amenity keys, and pet policy. Same-unit combination is mandatory. Eager-load property, eligible units, and selected media. Exclude hidden, suspended, draft, and rejected listings. Do not return tenant contacts or contracts.

Non-goals:
- Do not add a map.
- Do not persist a stored availability count.
- Do not authorize a booking from the search result.
- Do not put is_favourite on the public DTO.
- Do not geocode.

## Implementation checklist
- [ ] Add ListingController index and show plus a shared eligibility query.
- [ ] Convert inclusive end to exclusive end plus one day.
- [ ] Return available_count and rent min/max from the qualifying units.
- [ ] Add indexes agreed with RENT-079 rather than guessing a final plan.

## API and data contract
GET /api/v1/listings paginated 200. Invalid one-sided dates or reversed dates return 422. Unknown id or ineligible listing returns 404. Cache-Control public only for responses with no user-specific field. Default date label is included in the payload when dates are omitted.

## Acceptance criteria
- [ ] One of two units overlapping the range leaves count 1 and the other unit's rent.
- [ ] A unit failing price and a different unit failing pets does not return the listing.
- [ ] 30 June end and 1 July start still returns the unit.
- [ ] A suspended listing returns 404 on detail.
- [ ] The JSON has no contact_phone, document_path, or is_admin.
- [ ] Search does not insert a tenancy.

## Tests and evidence
Postgres feature tests for FR19, FR20, FR40, and FR77, including an adjacent range and a suspended detail.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #92
- RENT-033 (GitHub #47)
- RENT-008 (GitHub #16)
- RENT-027 (GitHub #38)

## Ownership and review
- Planning owner: Member B
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: high
- Tentative estimate: 2 days
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M04`, priority `P0`, risk `high`
- Publication: GitHub issue #50

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

