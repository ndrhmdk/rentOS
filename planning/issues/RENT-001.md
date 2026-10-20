<!-- rentos-task: RENT-001 -->

## Outcome
Member A collects a written lecturer decision that states whether Next.js replaces the printed Blade/Livewire criterion (T3a) and whether Supabase JWT plus Laravel Policies replaces the printed Sanctum scopes criterion (T4b). The decision is stored in the repository as evidence the marker can see. Implementation of the chosen stack continues without waiting, and this issue does not authorize adding Sanctum token issuance or a second password store.

## References
- Requirement IDs: None. This is a course or foundation task.
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: No single FR row. Observable checks are below.
- Module: M10
- Rubric IDs: T3a, T4b
- Product priority: course
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M10-*` when that directory exists.

## Current repository evidence
Printed criteria are in docs/08-project/course-compliance.md rows T3a and T4b. docs/08-project/open-questions.md records both substitutions as unresolved. backend/composer.json requires laravel/sanctum ^4 and backend/database/migrations/2026_10_19_063125_create_personal_access_tokens_table.php exists, but routes/api.php exposes only GET /api/health. No lecturer email, rubric amendment, or approval file is in the repository. The user-reported approval is not a file.

## Scope and non-goals
Add a short evidence note under docs/08-project/ that quotes the lecturer's exact decision, date, and channel, and links it from course-compliance status for T3a and T4b only. If the lecturer has not answered, the note records the question sent and leaves both rows pending.

Non-goals:
- Do not install or remove Sanctum as part of this issue.
- Do not block property, listing, tenancy, or favourites work.
- Do not claim the printed rubric items are already satisfied.
- Do not switch the product to Blade, Livewire, or a second Express/Next.js project.

## Implementation checklist
- [ ] Draft the exact question covering T3a Blade/Livewire versus Next.js and T4b Sanctum scopes versus Supabase JWT/Policies.
- [ ] Send it to the lecturer and file the reply or the unanswered request.
- [ ] Update only the T3a and T4b status lines so later issues can point at the evidence.

## API and data contract
No API or schema change. Evidence file is documentation. Sanctum personal-access-token tables stay untouched until a later identity issue explicitly refuses to issue PATs.

## Acceptance criteria
- [ ] Member A collects a written lecturer decision that states whether Next.
- [ ] A repository file quotes the lecturer decision or records that no decision has been received.
- [ ] T3a and T4b are the only rubric rows whose status this issue changes.
- [ ] The note says unrelated implementation continues on Next.js, Laravel, and Supabase.
- [ ] No Sanctum token endpoint is added.
- [ ] Concurrency, stale revision, retry, or deadline behavior is covered above where this issue changes shared state. Where this is a read-only screen or a document, the issue says so in the tests section.

## Tests and evidence
No runtime test. The evidence file is the artifact. Do not mark T3a or T4b passed inside a test suite.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- None

## Ownership and review
- Planning owner: Member A
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: high
- Tentative estimate: 0.5 day
- Existing labels to apply: question, documentation
- Proposed extra labels, not created yet: module `M10`, priority `course`, risk `high`
- Publication: GitHub issue #1

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.
