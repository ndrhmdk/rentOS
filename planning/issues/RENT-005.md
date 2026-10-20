<!-- rentos-task: RENT-005 -->

## Outcome
A developer can point Laravel at a Supabase Postgres database and a Storage bucket using environment variables, run migrations, and see a failed Storage call logged without secrets. Local domain tests that need exclusion constraints use Postgres. The default phpunit sqlite connection remains only for framework smoke tests that do not claim date-overlap proof.

## References
- Requirement IDs: None. This is a course or foundation task.
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: No single FR row. Observable checks are below.
- Module: M10
- Rubric IDs: T2a, T3f
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M10-*` when that directory exists.

## Current repository evidence
backend/.env.example was checked via config/database.php, which still offers sqlite, mysql, and pgsql. backend/phpunit.xml sets DB_CONNECTION=sqlite. config/filesystems.php has local/s3-style disks and no Supabase Storage disk. No SUPABASE env keys are documented in the root README. composer.json has no Supabase PHP SDK; the Storage HTTP API can be called without treating an SDK import as the integration.

## Scope and non-goals
Document and add env keys for Postgres host, database, user, password, SSL, Supabase project URL, anon key, service role key, JWT issuer, audience, and JWKS URL. Add a private Storage disk configuration that calls the Supabase Storage HTTP API. Add a Postgres phpunit profile named pgsql that RENT-008 and later race tests must use. Keep service role keys out of git.

Non-goals:
- Do not commit a filled .env.
- Do not create domain tables in this issue.
- Do not claim an SDK install is the external-API evidence.
- Do not pay for a hosted monitoring product.

## Implementation checklist
- [ ] Extend .env.example and backend/README setup steps for Supabase Postgres and Storage.
- [ ] Add the Storage disk and a redacted error log on non-2xx Storage responses.
- [ ] Add the pgsql test profile and state that sqlite cannot prove GiST exclusion.

## API and data contract
Storage operations use the project URL and service role on the server only. Client uploads, when later added, use a short-lived signed path issued by Laravel. Connection failure returns 503 with a correlation id and no key material.

## Acceptance criteria
- [ ] Migrations run against the configured Postgres database.
- [ ] A Storage health call that receives a 401 or network error is logged with status and request id, and the secret header is absent from the log line.
- [ ] phpunit.xml documents which tests require the pgsql profile.
- [ ] .env.example contains placeholders only.

## Tests and evidence
A faked HTTP test for the Storage disk error path. A connection note in backend/README. Do not claim a live Supabase project was reached unless the developer records that evidence separately.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #88

## Ownership and review
- Planning owner: Member A
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: high
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M10`, priority `P0`, risk `high`
- Publication: GitHub issue #4

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

