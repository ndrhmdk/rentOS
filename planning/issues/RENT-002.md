<!-- rentos-task: RENT-002 -->

## Outcome
After the API accepts only Authorization bearer tokens, Member A records which demonstration the lecturer accepts for printed CSRF protection. The note distinguishes bearer requests, which do not send ambient cookies, from any cookie-authenticated route that would need framework CSRF tokens.

## References
- Requirement IDs: None. This is a course or foundation task.
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: No single FR row. Observable checks are below.
- Module: M01
- Rubric IDs: T3c
- Product priority: course
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M01-*` when that directory exists.

## Current repository evidence
docs/07-architecture/security-design.md says bearer endpoints must not accept ambient auth cookies and that CORS is not a CSRF defense. docs/08-project/open-questions.md leaves the accepted demonstration open. backend/config/sanctum.php and session middleware exist from the Laravel skeleton. No CSRF feature test exists under backend/tests.

## Scope and non-goals
Document the actual transport: Laravel API routes reject cookie session authentication for /api/v1 product routes; browser clients send the Supabase access token in Authorization. Add a feature test that a state-changing /api/v1 request with an ambient session cookie and no bearer token returns 401. Record the lecturer's accepted demo steps, or that the question is still open.

Non-goals:
- Do not disable CSRF globally.
- Do not add a cookie login merely to demonstrate a token field.
- Do not treat field validation or CORS headers as the CSRF evidence.
- Do not block listing or tenancy issues on the lecturer reply.

## Implementation checklist
- [ ] Confirm product mutations read only the bearer guard from RENT-012.
- [ ] Add the hostile cookie-without-bearer test.
- [ ] File the lecturer demonstration script or the outstanding question beside the T3c row.

## API and data contract
Product writes use Authorization: Bearer. 401 when the bearer is missing or invalid. Cookie session, when present, is not an actor. Error body uses the shared error schema and a correlation id, with no token echo.

## Acceptance criteria
- [ ] A mutation without a bearer token is rejected even if a Laravel session cookie is attached.
- [ ] The evidence note states whether the lecturer accepted this bearer demonstration.
- [ ] If any future cookie-authenticated form is introduced, this issue's note is reopened rather than silently waived.
- [ ] CORS configuration is described as a separate origin control.

## Tests and evidence
Feature test in backend/tests/Feature/Auth/BearerTransportTest.php using the real HTTP kernel. No claim that the test has already passed.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #88
- RENT-012 (GitHub #15)

## Ownership and review
- Planning owner: Member A
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: high
- Tentative estimate: 0.5 day
- Existing labels to apply: question, documentation
- Proposed extra labels, not created yet: module `M01`, priority `course`, risk `high`
- Publication: GitHub issue #19

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

