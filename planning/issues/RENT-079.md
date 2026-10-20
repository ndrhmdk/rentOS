<!-- rentos-task: RENT-079 -->

## Outcome
The listing search and tenancy proposal paths eager-load the relations they serialize and use an index that the slow-query sample can show. The pull request includes a before/after query count or plan for one search request. It does not claim a production SLO.

## References
- Requirement IDs: None. This is a course or foundation task.
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: No single FR row. Observable checks are below.
- Module: M04
- Rubric IDs: T6d
- Product priority: course
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M04-*` when that directory exists.

## Current repository evidence
No domain queries exist yet. T6d requires eager loading, indexes, and before/after evidence. FR19 warns about N+1 property, unit, and media queries.

## Scope and non-goals
Add the missing eager loads and one supporting index justified by EXPLAIN on Postgres. Capture the before/after in the pull request. Coordinate the index with the search SQL from RENT-039.

Non-goals:
- Do not add indexes for every column.
- Do not cache the search result and call it the optimization.
- Do not fabricate EXPLAIN output.
- Do not change the overlap rule to make the query simpler.

## Implementation checklist
- [ ] Count queries on the search feature test.
- [ ] Add the eager load and index.
- [ ] Attach EXPLAIN or the query-count note.

## API and data contract
Search serialization does not query inside a loop over listings. The index is created in a migration owned by this issue.

## Acceptance criteria
- [ ] The attached note shows a lower query count or a plan that uses the new index.
- [ ] Proposal overlap behavior from RENT-048 still passes.
- [ ] The note is from a real run.

## Tests and evidence
A feature test that asserts a query-count ceiling for a page of listings, plus the existing overlap test still present.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #96
- RENT-039 (GitHub #50)
- RENT-048 (GitHub #66)

## Ownership and review
- Planning owner: Member B
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: medium
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M04`, priority `course`, risk `medium`
- Publication: GitHub issue #74

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

