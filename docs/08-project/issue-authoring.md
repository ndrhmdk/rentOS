# GitHub issue authoring contract

## Audit before planning
Read repository AGENTS.md/root README/layout/package/composer manifests and existing branches/tests. Inspect current GitHub open/closed issues and PRs if available. User has previously completed design/setup/requirements work and reports favourites newly added; verify actual state. Classify each requirement: implemented+verified, partial, missing, deferred or blocked-specific-decision. Link code/test evidence; no invented completion.

## Scope
Create a dependency-ordered, nonduplicative backlog covering core FRs/ACs and every course rubric/submission item. Do not create one issue per table, every criterion or every FR mechanically. A coherent vertical feature may satisfy several IDs; shared infrastructure gets one owner. Separate property creation, units, listing draft, review and publication stories; link dependencies. Critical allocation/confirmation logic remains separate from admin presentation tasks.

Issue sizes: bounded D screens0.25–0.5developer-day; ordinary feature slices0.5–1day; complex backend/concurrency actions may need1–2days with explicit review/test boundaries. Estimates are tentative and revised after repository audit. Do not impose an arbitrary total count. Epics summarize, not duplicate implementation checklists.

## Required issue body
```markdown
## Outcome
Concrete user trigger and resulting behavior.
## References
FR IDs, AC IDs, workflow/module doc links, rubric IDs where applicable.
## Current repository evidence
Implemented/partial/missing facts, file paths or absence actually checked.
## Scope and non-goals
Exact UI/API/data/job change; explicitly bounded exclusions.
## Implementation checklist
- [ ] Proposed steps tied to repository's actual structure
## API and data contract
Routes/methods/statuses/payload/schema/constraints/privacy; migration owner if relevant.
## Acceptance criteria
- [ ] Observable happy path
- [ ] Validation, auth/ownership, empty/loading/failure states
- [ ] Relevant race/stale/retry/deadline/caching cases (or reason concurrency is inapplicable)
## Tests and evidence
Meaningful unit/integration/E2E/PostgreSQL coverage, actual expected artifacts; do not claim run results.
## Dependencies
Stable task keys first, then actual issue numbers after creation. No cycles.
## Ownership and review
Planning alias, mapped real assignee only if verified, required reviewer, skill/risk and tentative estimate.
## Definition of done
Behavior integrated, tests passing, docs/Scramble synchronized, linked PR and rubric evidence if applicable.
```

## Labels and milestones
Propose module/area, product-priority, course-required, risk and skill labels using existing repo labels where possible. Owner aliases are planning metadata, not fake usernames. Milestones use real deadline/sprints; do not invent dates. D gets admin UI/accessibility/fixture/test/documentation slices; backend authorization/transactions owned/reviewed by A/B.

## Safe publication and duplicate prevention
Write local `issue-plan.md`, `issues-manifest.json` and one Markdown body per task before publishing. Use stable task IDs such as RENT-001 and embed a machine-readable HTML marker in each body for replay deduplication. If repo/auth are verified and the user invoked this prompt to create issues, publish only missing approved-scope tasks in that repo; otherwise retain drafts and report what is missing. Do not delete/close/rewrite existing TODO/issues just to fit the new backlog. Reuse/link existing work.

Use structured API fields or `gh issue create --body-file`; preserve literal newlines and never interpolate issue text into a shell command. First create/reuse issues in topological order; store actual numbers/URLs, then resolve dependency references in a second pass if needed. Retry by stable marker, never blindly create duplicates after timeouts. Do not fabricate assignments, URLs or passing tests. Stop only dependent ambiguous publication/assignment actions, not the entire useful local plan.
