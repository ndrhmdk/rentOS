<!-- rentos-task: RENT-026 -->

## Outcome
An owner can set property policy defaults and shared rules, and unit overrides plus additional rules, using the documented JSONB shapes. Unknown keys are rejected. A later contract snapshot is not written by this endpoint.

## References
- Requirement IDs: FR60, FR61
- Full case list for the cited FRs. The checks this issue owns are in Acceptance criteria: FR60-AC01, FR60-AC02, FR60-AC03, FR60-AC04, FR61-AC01, FR61-AC02, FR61-AC03, FR61-AC04
- Module: M02
- Rubric IDs: T2a
- Product priority: P0
- Workflow and contract sources: `docs/07-architecture/api-design.md`, `docs/07-architecture/data-model.md`, `docs/02-domain/business-rules.md`, and the module PRD under `docs/03-modules/M02-*` when that directory exists.

## Current repository evidence
policies and policy_overrides columns are specified with no writer. ADR-005 describes the JSONB choice. No policy validator exists.

## Scope and non-goals
PATCH /api/v1/properties/{property}/policies and PATCH unit policy overrides. Validate schema_version, allowlisted enum keys, and text length. Increment content_revision. Return the effective policy for one unit by applying overrides on read.

Non-goals:
- Do not create policy join tables.
- Do not rewrite tenancy_contracts.policies_snapshot.
- Do not accept arbitrary JSON objects.
- Do not add a policy approval state.

## Implementation checklist
- [ ] Add validators and update actions.
- [ ] Add an effective-policy resolver used later by search and contracts.
- [ ] Audit hook can be a call point completed in RENT-029.

## API and data contract
422 for unknown keys or wrong types. 409 for stale expected_revision. 200 returns stored JSON and, for a unit read, the resolved view. Numeric rent stays on unit columns, not inside policy JSON.

## Acceptance criteria
- [ ] A pet override on the unit changes the effective pet rule and leaves the property default stored.
- [ ] An unknown key returns 422 and does not write.
- [ ] Editing policies does not update any tenancy_contracts row.
- [ ] Another owner receives 404.

## Tests and evidence
Feature tests for override resolution, unknown key rejection, and the contract-row unchanged assertion.

Do not treat this issue body as a record that those tests have already passed.

## Dependencies
- Parent epic: #90
- RENT-020 (GitHub #32)

## Ownership and review
- Planning owner: Member B
- GitHub assignee: unset. Collaborators on 20 October 2026 are `ndrhmdk` (admin) and `DangCongKhai` (write). Neither has been mapped to Member A, B, C, or D.
- Reviewer: Member A
- Risk: medium
- Tentative estimate: 1 day
- Existing labels to apply: enhancement
- Proposed extra labels, not created yet: module `M02`, priority `P0`, risk `medium`
- Publication: GitHub issue #37

## Definition of done
The behavior is integrated on a topic branch and reviewed in a pull request that links this issue. Tests named above are running in CI when the suite exists. API changes stay consistent with Scramble once RENT-071 has generated a spec. Course evidence issues attach the artifact they name. Member D does not close an admin screen from fixture mode alone after the real endpoint exists.

