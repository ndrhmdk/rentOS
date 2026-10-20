<!-- rentos-task: RENT-003 -->

## Outcome
A contributor can open a topic branch, commit with an issue reference, and open a pull request into the default branch. GitHub Actions runs the Laravel test suite and the frontend typecheck on that pull request. Direct work on the default branch stays prohibited by the existing root README rule.

## References
- Requirement IDs: None. This is a course or foundation task.
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: No single FR row. Observable checks are below.
- Module: M10
- Rubric IDs: T1a, T1b, T1d
- Product priority: course
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M10-*` when that directory exists.

## Current repository evidence
Remote origin is https://github.com/ndrhmdk/rentOS.git. Default branch is develop. Current branch project_guidance_setup has commits a0d2ac5, 44c127f, and 08f2177. .github/PULL_REQUEST_TEMPLATE.md exists. No .github/workflows file exists. Root README.md already forbids direct pushes to main, while the repository default branch is develop. No branch protection could be read from the local clone.

## Scope and non-goals
Add .github/workflows/ci.yml that checks out the repo, installs backend PHP 8.3 dependencies, runs php artisan test, and runs the frontend typecheck once RENT-004 has a package script. Extend the pull request template with issue link, test evidence, and rubric id fields. Document the branch name pattern <issue-number>-short-topic and commit footer Refs #<issue>. Point the root README prohibition at develop as well as main.

Non-goals:
- Do not require status checks as the only review.
- Do not rewrite published history.
- Do not create sprint milestones or dates.
- T1c issue bodies are the backlog itself, not this workflow file.

## Implementation checklist
- [ ] Add the workflow for backend tests and frontend typecheck.
- [ ] Document branch, commit, and pull request expectations in the root README in one short section.
- [ ] Align the protected-branch wording with the actual default branch develop.

## API and data contract
CI is pull-request and push-to-develop. It does not deploy. Secrets are not printed. Failure of php artisan test or the frontend typecheck fails the check.

## Acceptance criteria
- [ ] A pull request shows the template sections and a CI run.
- [ ] A commit message in the contributing note includes an issue reference and a purpose.
- [ ] The workflow file lives in .github/workflows and is the first Actions workflow in the repo.
- [ ] README names develop as the integration branch.

## Tests and evidence
The workflow runs php artisan test and the frontend check. Do not claim a green run in this issue.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #88

## Ownership and review
- Planning owner: Member A
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: medium
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M10`, priority `course`, risk `medium`
- Publication: GitHub issue #2

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

