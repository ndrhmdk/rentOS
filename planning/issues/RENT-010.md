<!-- rentos-task: RENT-010 -->

## Outcome
favourite_properties stores one row per user and property. The pair is unique. Pagination can order by created_at and id for that user. Saving a property does not create a rental request or a tenancy.

## References
- Requirement IDs: FR88
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR88-AC01, FR88-AC02, FR88-AC03, FR88-AC04, FR88-AC05, FR88-AC06, FR88-AC07, FR88-AC08, FR88-AC09, FR88-AC10
- Module: M04
- Rubric IDs: T2a
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M04-*` when that directory exists.

## Current repository evidence
No favourite_properties table exists. The SQL in docs/07-architecture/data-model.md is the target. A search of backend/ for favourite returned no domain code. FR88 is specified and unimplemented.

## Scope and non-goals
One migration and model. Unique (user_id, property_id). Index (user_id, created_at desc, id desc). user_id references user_profiles. property_id references properties. No status enum and no soft delete.

Non-goals:
- Do not key the row by listing_id or unit_id.
- Do not add a toggle column.
- Do not cascade-delete in a way that leaks hidden listing fields.
- Do not implement HTTP in this issue.

## Implementation checklist
- [ ] Add the migration exactly to the dictionary columns.
- [ ] Add a model relationship used later by RENT-042.
- [ ] Test the unique pair and the pagination index presence.

## API and data contract
id uuid default gen_random_uuid(). created_at timestamptz not null default now(). No client-supplied user_id column writer.

## Acceptance criteria
- [ ] Two inserts of the same pair fail.
- [ ] Different users can save the same property.
- [ ] Archiving a property is not required to delete the favourite row.
- [ ] No extra status column exists.

## Tests and evidence
Postgres unique-constraint test. This issue does not claim UI coverage.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #89
- RENT-006 (GitHub #9)
- RENT-007 (GitHub #14)

## Ownership and review
- Planning owner: Member B
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: medium
- Tentative estimate: 0.5 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M04`, priority `P0`, risk `medium`
- Publication: GitHub issue #18

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

