<!-- rentos-task: RENT-028 -->

## Outcome
An owner can edit shared house rules, unit overrides, standard amenity checkboxes from the catalog, and custom amenity lines. The screen separates shared facilities from in-unit features. Save errors stay next to the field.

## References
- Requirement IDs: FR60, FR61, FR87
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR60-AC01, FR60-AC02, FR60-AC03, FR60-AC04, FR61-AC01, FR61-AC02, FR61-AC03, FR61-AC04, FR87-AC01, FR87-AC02, FR87-AC03, FR87-AC04, FR87-AC05, FR87-AC06, FR87-AC07, FR87-AC08, FR87-AC09, FR87-AC10
- Module: M02
- Rubric IDs: None
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M02-*` when that directory exists.

## Current repository evidence
No policy or amenity form exists. Catalog and policy APIs are RENT-026 and RENT-027.

## Scope and non-goals
Forms on the property and unit screens. Load GET /api/v1/amenities once. Submit the JSON shapes those issues define. Show the effective unit policy after save.

Non-goals:
- Do not offer free-form JSON editing.
- Do not invent a new amenity key in the browser.
- Do not display contract snapshots.

## Implementation checklist
- [ ] Build policy fields and amenity pickers.
- [ ] Show catalog labels, not raw keys, with the key submitted in the payload.
- [ ] Explain shared versus in-unit scope in the form.

## API and data contract
Submits only the documented JSON. expected_revision included. No owner_label field.

## Acceptance criteria
- [ ] Saving pets and a shared laundry amenity refetches the same values.
- [ ] A custom duplicate line shows the server's deduped list.
- [ ] A wrong-scope selection cannot be offered for that form.
- [ ] Empty amenities explain that none are advertised yet.

## Tests and evidence
UI tests with a mocked catalog for scope separation and a 422 display.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #90
- RENT-021 (GitHub #35)
- RENT-026 (GitHub #37)
- RENT-027 (GitHub #38)

## Ownership and review
- Planning owner: Member C
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member B
- Risk: low
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M02`, priority `P0`, risk `low`
- Publication: GitHub issue #41

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

