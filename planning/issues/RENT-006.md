<!-- rentos-task: RENT-006 -->

## Outcome
Postgres has user_profiles.id as a UUID primary key referencing the Supabase auth user id. is_admin defaults false and is not writable by a profile update. The Laravel users table is not the product identity.

## References
- Requirement IDs: FR01
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR01-AC01, FR01-AC02, FR01-AC03, FR01-AC04
- Module: M01
- Rubric IDs: T2a
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M01-*` when that directory exists.

## Current repository evidence
backend/database/migrations/0001_01_01_000000_create_users_table.php creates an integer id, email, and password. No user_profiles migration exists. docs/07-architecture/data-dictionary.md defines user_profiles.id, full_name, phone, is_admin, account_status, and revision. app/Models/User.php is the framework model.

## Scope and non-goals
Add a Laravel migration for user_profiles matching the dictionary columns and defaults. Domain foreign keys later reference user_profiles.id. Application code must not authenticate with users.password.

Non-goals:
- Do not drop the framework users table in this issue.
- Do not issue Sanctum personal access tokens.
- Do not build the signup UI.
- Do not add a role-selection column.

## Implementation checklist
- [ ] Write the migration and a UserProfile model with UUID key.
- [ ] Add a database constraint or column comment that is_admin has no client writer in this slice.
- [ ] Point later domain docs at user_profiles rather than users.

## API and data contract
user_profiles.id uuid PK. is_admin boolean not null default false. account_status text not null default ACTIVE. revision integer not null default 1. full_name required once the profile is bootstrapped. phone nullable.

## Acceptance criteria
- [ ] Migrating on Postgres creates user_profiles and rejects a duplicate id.
- [ ] A factory can insert a non-admin profile.
- [ ] No migration copies passwords into a second product credential store.
- [ ] Integer users.id is not used as a domain foreign key.

## Tests and evidence
Migration test on the pgsql profile asserting columns, PK, and is_admin default. SQLite is not the proof.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #89
- RENT-005 (GitHub #4)

## Ownership and review
- Planning owner: Member A
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: high
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M01`, priority `P0`, risk `high`
- Publication: GitHub issue #9

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

