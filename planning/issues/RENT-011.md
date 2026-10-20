<!-- rentos-task: RENT-011 -->

## Outcome
php artisan db:seed on Postgres loads a deterministic set: a published listing, a hidden listing, a suspended listing, an unapproved draft, overlapping and adjacent tenancy examples, an open report, a favourite on a visible property, and a favourite whose target is suspended. IDs are stable UUIDs so UI fixtures and tests can reuse them.

## References
- Requirement IDs: None. This is a course or foundation task.
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: No single FR row. Observable checks are below.
- Module: M10
- Rubric IDs: T2b
- Product priority: course
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M10-*` when that directory exists.

## Current repository evidence
backend/database/seeders/DatabaseSeeder.php only calls the framework user factory. No domain seeders exist. Course row T2b requires these scenarios.

## Scope and non-goals
Seeders for profiles, properties, units, media metadata, listings, requests, contracts, reports, favourites, and one outbox row. Document the passwordless Supabase users as pre-agreed test auth users, not seeded passwords in Laravel.

Non-goals:
- Do not seed property reviews or map coordinates as a feature.
- Do not put production data in the seeder.
- Do not make sqlite the seeded proof of exclusion data.

## Implementation checklist
- [ ] Replace the example seeder call path with domain seeders.
- [ ] Document each scenario in backend/database/seeders/README.md.
- [ ] Keep UUIDs constant across runs.

## API and data contract
Seed data uses the same status enums as the migrations. Suspended listing has admin_suspended_at and suspension_reason set. Favourite placeholder scenario keeps the favourite row.

## Acceptance criteria
- [ ] A fresh migrate and seed is repeatable.
- [ ] The documented UUIDs select one row of each required scenario.
- [ ] Seeding twice without migrate does not duplicate unique pairs.
- [ ] No service-role key is embedded.

## Tests and evidence
A seeder test on Postgres asserts scenario counts and the stable suspended-favourite pair.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #89
- RENT-007 (GitHub #14)
- RENT-008 (GitHub #16)
- RENT-009 (GitHub #17)
- RENT-010 (GitHub #18)

## Ownership and review
- Planning owner: Member B
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: medium
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M10`, priority `course`, risk `medium`
- Publication: GitHub issue #21

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

