<!-- rentos-task: RENT-004 -->

## Outcome
The product UI is a Next.js app in frontend/ with TypeScript, Tailwind, and TanStack Query. Design tokens from design/tokens/rentos-tokens.css are available. Routes for public home, sign-in, and an authenticated app shell render loading, empty, and error boundaries. This shell does not implement rental workflows.

## References
- Requirement IDs: None. This is a course or foundation task.
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: No single FR row. Observable checks are below.
- Module: M10
- Rubric IDs: T3a
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M10-*` when that directory exists.

## Current repository evidence
Root README.md still says the frontend is React + TypeScript. frontend/package.json now runs Next.js 16 with Tailwind 4, and App Router files exist under frontend/src/app. The scaffold is still create-next-app default: no TanStack Query dependency, no /sign-in or /app placeholder routes, no shared loading/empty/error components, and no typecheck or test script. Legacy Vite files (frontend/src/App.tsx, frontend/src/main.tsx, and frontend/src/assets/*) are still present and should be removed or migrated deliberately.

## Scope and non-goals
Build on the existing Next.js App Router scaffold in frontend/. Add a token bridge to the existing design CSS, add a TanStack Query provider, add shared error/loading/empty components, and add placeholder routes for sign-in and app shells. Remove or migrate leftover Vite entry files and assets so frontend/ has one clear runtime path.

Non-goals:
- Do not port the Laravel welcome Blade page into the product.
- Do not implement search, favourites, or admin screens here.
- Do not add Google OAuth.
- Do not recreate backend/frontend as a second UI.

## Implementation checklist
- [ ] Complete the Next.js foundation on top of the current scaffold, and remove or migrate leftover Vite entry files in frontend/src.
- [ ] Wire design tokens and base layout from design/.
- [ ] Add script entries typecheck and lint used by RENT-003.
- [ ] Document the dev command in frontend/README.md.

## API and data contract
No Laravel route changes. Browser routes are Next.js paths only. Environment variables for the API base URL are public NEXT_PUBLIC_API_BASE_URL with no service-role key in the client bundle.

## Acceptance criteria
- [ ] npm run dev in frontend/ serves the Next.js shell.
- [ ] A missing API response shows the shared error state rather than a blank page.
- [ ] The client bundle configuration does not reference a Supabase service role key.
- [ ] backend/frontend is not a documented product entry point.

## Tests and evidence
Component test for the shared loading, empty, and error states using the frontend test runner chosen in this issue. Typecheck script exits non-zero on a type error.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #88

## Ownership and review
- Planning owner: Member C
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: medium
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M10`, priority `P0`, risk `medium`
- Publication: GitHub issue #3

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

