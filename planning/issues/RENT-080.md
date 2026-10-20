<!-- rentos-task: RENT-080 -->

## Outcome
The root README tells a marker how to run the Next.js app and the Laravel API, lists the stack, summarizes the features, points at the ERD, and embeds or links screenshots. It no longer sends readers to docs/prd, which is not a directory.

## References
- Requirement IDs: None. This is a course or foundation task.
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: No single FR row. Observable checks are below.
- Module: M10
- Rubric IDs: README
- Product priority: course
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M10-*` when that directory exists.

## Current repository evidence
README.md is 23 lines, calls the frontend React, and points at docs/prd and design/. The implementation docs live under docs/ with an ERD at docs/07-architecture/database-schema.mmd. Screenshots are not in the README.

## Scope and non-goals
Rewrite the root README sections: overview, tools, setup, feature list, ERD link, and screenshot placeholders that D and C replace with real images. Keep the stack statement aligned with the approved Next.js + Laravel + Supabase direction. Do not paste secrets.

Non-goals:
- Do not treat the docs tree as a substitute for this README.
- Do not invent screenshot files.
- Do not document the nested Vite apps as the product.
- Do not add a second identity setup.

## Implementation checklist
- [ ] Rewrite setup for backend and frontend.
- [ ] Link the Mermaid ERD.
- [ ] Leave clearly marked screenshot slots for the main flows.
- [ ] Mention develop as the integration branch.

## API and data contract
Commands in the README match composer.json and the Next.js package scripts. Env examples point at .env.example.

## Acceptance criteria
- [ ] A new reader can find install, migrate, seed, API, and web commands.
- [ ] The ERD link resolves.
- [ ] The stack line says Next.js, Laravel, and Supabase.
- [ ] docs/prd is not the setup target.
- [ ] Screenshot slots name the screen they will show.

## Tests and evidence
No automated test. Reviewer C checks the commands against the package scripts.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #96
- RENT-011 (GitHub #21)
- RENT-071 (GitHub #34)

## Ownership and review
- Planning owner: Member A
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member C
- Risk: medium
- Tentative estimate: 1 day
- Existing labels to apply: documentation
- Proposed extra labels, not created yet: module `M10`, priority `course`, risk `medium`
- Publication: GitHub issue #39

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

