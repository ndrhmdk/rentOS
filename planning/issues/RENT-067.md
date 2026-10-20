<!-- rentos-task: RENT-067 -->

## Outcome
Laravel can run a database queue worker and the scheduler against the Supabase Postgres connection. A sample job retries with backoff and does not double-apply a successful side effect. The host that will actually run the worker is named in the setup note, even if that host is a developer machine during the course.

## References
- Requirement IDs: None. This is a course or foundation task.
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: No single FR row. Observable checks are below.
- Module: M10
- Rubric IDs: T6a
- Product priority: course
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M10-*` when that directory exists.

## Current repository evidence
database/migrations/0001_01_01_000002_create_jobs_table.php exists. config/queue.php defaults are framework values. routes/console.php has no domain schedule. No process supervisor is documented. The monitoring host is still an open question.

## Scope and non-goals
Set QUEUE_CONNECTION=database for the documented local and demo environment. Document how to run queue:work and schedule:run. Add a health command that prints whether the worker loop is expected. Do not deploy a paid worker platform.

Non-goals:
- Do not implement expiry or notification jobs here.
- Do not add Kafka.
- Do not claim a production SLA.
- Do not leave sqlite as the queue used by domain jobs.

## Implementation checklist
- [ ] Configure the database queue on Postgres.
- [ ] Document the worker and cron or schedule:work command.
- [ ] Add one retry test that uses a fake job and an idempotency guard.

## API and data contract
Failed jobs land in failed_jobs with a redacted exception. Retry respects tries and backoff. A job id is not authorization.

## Acceptance criteria
- [ ] A failing fake job is retried and then listed as failed.
- [ ] A second successful handling of the same idempotency key does not duplicate its side effect.
- [ ] README states the exact process the demo will run.
- [ ] Domain schedules can register commands in later issues.

## Tests and evidence
Feature test for retry and the idempotent fake job using the database queue driver on Postgres, or the sync driver plus an explicit retry test if the demo driver is documented separately.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #96
- RENT-005 (GitHub #4)

## Ownership and review
- Planning owner: Member A
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: medium
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M10`, priority `course`, risk `medium`
- Publication: GitHub issue #10

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

