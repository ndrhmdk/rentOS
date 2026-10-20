<!-- rentos-task: RENT-081 -->

## Outcome
The team publishes one MP4 or an accessible YouTube link, public or unlisted, at 720p or higher and no longer than 10 minutes. The recording shows a listing search, a proposal conflict or confirmation, a favourite, an admin decision, and the log, slow-query, and host-metric evidence. It is not a private link.

## References
- Requirement IDs: None. This is a course or foundation task.
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: No single FR row. Observable checks are below.
- Module: M10
- Rubric IDs: DEMO
- Product priority: course
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M10-*` when that directory exists.

## Current repository evidence
No demo file or link exists. The brief requires the length, resolution, and an accessible link. Feature screens are still unbuilt.

## Scope and non-goals
A timed script and the published link added to the root README. The script includes the evidence screens from monitoring issues, not only the marketing pages.

Non-goals:
- Do not exceed 10 minutes.
- Do not upload a private video and call it submitted.
- Do not skip the alert evidence.
- Do not record passwords or service keys.

## Implementation checklist
- [ ] Write the script with timings.
- [ ] Record at 720p or higher.
- [ ] Publish the accessible link in the README.

## API and data contract
The README contains the URL and the duration. The video shows the five evidence beats agreed in the script.

## Acceptance criteria
- [ ] Runtime is 10 minutes or less.
- [ ] Resolution is at least 720p.
- [ ] Search, a tenancy decision, favourites, an admin reason, and one alert are visible.
- [ ] No secret is spoken or shown.

## Tests and evidence
Human review of the published link. Do not claim the video exists before the link is added.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #96
- RENT-080 (GitHub #39)
- RENT-075 (GitHub #13)
- RENT-074 (GitHub #57)
- RENT-054 (GitHub #71)

## Ownership and review
- Planning owner: Member A
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member C
- Risk: medium
- Tentative estimate: 1 day
- Existing labels to apply: documentation
- Proposed extra labels, not created yet: module `M10`, priority `course`, risk `medium`
- Publication: GitHub issue #79

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

