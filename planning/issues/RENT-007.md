<!-- rentos-task: RENT-007 -->

## Outcome
Postgres tables properties, units, property_media, and listings match the data dictionary, including archive timestamps, content_revision, one current non-archived listing per property, and a normalized unique unit label per property. WHOLE_SPACE versus SEPARATE_UNITS is stored, not implied by the UI.

## References
- Requirement IDs: FR07, FR41
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR07-AC01, FR07-AC02, FR07-AC03, FR07-AC04, FR41-AC01, FR41-AC02, FR41-AC03
- Module: M02
- Rubric IDs: T2a
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M02-*` when that directory exists.

## Current repository evidence
No migrations beyond users, cache, jobs, and personal_access_tokens exist under backend/database/migrations. docs/07-architecture/data-model.md and data-dictionary.md define these tables. docs/02-domain/business-rules.md BR01 and BR02 apply.

## Scope and non-goals
One migration series owned by Member B for these four tables and their indexes/checks. JSONB amenities and policies use the documented defaults. Listing moderation_status and publication_status defaults are DRAFT. admin_suspended_at, admin_suspended_by, and suspension_reason exist and are nullable.

Non-goals:
- Do not add property_reviews.
- Do not add a separate image-review status or replaces_image_id.
- Do not add geocode jobs.
- Do not enforce the GiST tenancy exclusion here.

## Implementation checklist
- [ ] Translate dictionary columns into Laravel migrations on Postgres.
- [ ] Add partial unique index for one non-archived listing per property.
- [ ] Add unique normalized unit label per property.
- [ ] Add checks for rental_arrangement, operational_status, and minimum_rental_months >= 3.

## API and data contract
All ids UUID. properties.owner_id references user_profiles. property_media.storage_path unique. listings.cover_media_id nullable until publish validation in a later issue. Archive is archived_at, not a hard delete.

## Acceptance criteria
- [ ] Migration up/down works on Postgres.
- [ ] A second non-archived listing for the same property fails.
- [ ] Two units on one property cannot share a normalized label.
- [ ] Suspended columns exist and default to unsuspended.

## Tests and evidence
Postgres migration tests for the unique listing and unit label constraints. Include a WHOLE_SPACE fixture row only as data, leaving the single-auto-unit rule to RENT-020.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #89
- RENT-006 (GitHub #9)

## Ownership and review
- Planning owner: Member B
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: high
- Tentative estimate: 2 days
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M02`, priority `P0`, risk `high`
- Publication: GitHub issue #14

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

