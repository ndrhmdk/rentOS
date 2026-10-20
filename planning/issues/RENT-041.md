<!-- rentos-task: RENT-041 -->

## Outcome
Public listing reads can be cached in Laravel and TanStack Query. A suspension, hide, archive, or content edit invalidates that listing. The public response still checks current visibility before it is returned, so a stale cache cannot serve a suspended listing. Favourite flags are never stored in the shared cache.

## References
- Requirement IDs: FR46
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR46-AC01, FR46-AC02, FR46-AC03
- Module: M04
- Rubric IDs: T6c
- Product priority: P1
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M04-*` when that directory exists.

## Current repository evidence
No cache tags or revalidation exist. FR46 and security-design.md forbid shared-cache personalization. config/cache.php is the framework default.

## Scope and non-goals
Cache the public DTO with a key that includes listing id and content revision, or invalidate on write. Visibility is checked from the database even on a cache hit. Document the choice in docs or the module README. Private routes send Cache-Control: private, no-store.

Non-goals:
- Do not cache search results as a booking guarantee.
- Do not cache /api/v1/me/* in a shared store.
- Do not skip the visibility read.
- Do not invent a CDN vendor.

## Implementation checklist
- [ ] Add cache write and invalidation on publish, hide, suspend, and content revision change.
- [ ] Add the visibility gate.
- [ ] Set private cache headers on authenticated routes that already exist.
- [ ] Document the decision.

## API and data contract
Suspended listing detail is 404 even if a previous 200 was cached. Edited approved content is visible on the next read without a new review. Availability in the cache is labeled indicative.

## Acceptance criteria
- [ ] After an approved content edit, the new title is returned.
- [ ] A cached payload inspection shows no is_favourite and no contact_phone.
- [ ] Logout behavior for private caches is covered with the auth screens, and this issue does not store favourites in the public key.

## Tests and evidence
Feature test that seeds a cache entry then suspends and asserts 404. A second test asserts the public payload keys.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #92
- RENT-039 (GitHub #50)
- RENT-033 (GitHub #47)

## Ownership and review
- Planning owner: Member C
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: high
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M04`, priority `P1`, risk `high`
- Publication: GitHub issue #56

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

