<!-- rentos-task: RENT-027 -->

## Outcome
GET /api/v1/amenities returns the code-managed catalog with stable keys, labels, and property or unit scope. Owners enable standard keys and add custom text on a property or unit. Custom text is trimmed, Unicode-normalized, and de-duplicated within that JSON value. Custom text never becomes a catalog key.

## References
- Requirement IDs: FR87
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR87-AC01, FR87-AC02, FR87-AC03, FR87-AC04, FR87-AC05, FR87-AC06, FR87-AC07, FR87-AC08, FR87-AC09, FR87-AC10
- Module: M02
- Rubric IDs: T4a
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M02-*` when that directory exists.

## Current repository evidence
No amenity catalog class exists. Dictionary defaults amenities to schema_version 1 with standard and custom. BR06 and FR87 describe NFC and case-fold dedup. No amenity tables should be created.

## Scope and non-goals
A versioned PHP catalog, public GET, and PATCH for property shared_amenities and unit amenities. Reject catalog keys used at the wrong scope. enabled true is the only advertised state. Custom entries are strings, not objects with owner slugs.

Non-goals:
- Do not add POST /api/v1/amenities.
- Do not create a global slug from custom text.
- Do not let a custom washing-machine phrase satisfy the standard in-unit key.
- Do not build the search filter in this issue.

## Implementation checklist
- [ ] Add the catalog and validator.
- [ ] Normalize custom text.
- [ ] Expose GET /api/v1/amenities without auth.
- [ ] PATCH owner amenities with revision check.

## API and data contract
GET 200 array of key, label, scope. PATCH 200 or 422. Public route is cacheable later; this issue sets Cache-Control public with a short max-age only if the catalog is static in code.

## Acceptance criteria
- [ ] Wrong-scope key returns 422.
- [ ] Two custom strings that differ only by case and spacing become one entry.
- [ ] Catalog GET does not include owner custom text.
- [ ] Disabling a key removes it from the advertised standard object rather than storing enabled false as a search hit.
- [ ] No amenity table is migrated.

## Tests and evidence
Unit tests for normalization and scope, plus a feature test for GET and PATCH. Cover the FR87 cases that are data rules; search matching stays in RENT-039.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #90
- RENT-020 (GitHub #32)

## Ownership and review
- Planning owner: Member B
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: medium
- Tentative estimate: 1.5 days
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M02`, priority `P0`, risk `medium`
- Publication: GitHub issue #38

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

