# Coverage validation

Generated with the backlog. This file is the local check, not a test run.

## Core requirements
Every P0 and P1 FR id is referenced by at least one implementable issue.

## Deferred scope
P2 and P3 IDs are not implementation targets. They are listed in `repository-audit.md`.

## Rubric
Every course row except T1c has an issue. T1c is this backlog's issue bodies, dependencies, and owners.

## Dependency graph
Topological sort succeeded, so the dependency edges are a DAG.

## Split ownership
Admin HTTP transitions are RENT-032 and RENT-061, owned by Member B and reviewed by Member A. Admin screens are RENT-035 through RENT-038 and RENT-062 through RENT-066, owned by Member D. Frontend tests for those screens are D's. API coverage is RENT-076. UI coverage is RENT-077 and includes D's files.

## Contract compatibility
Routes match `docs/07-architecture/api-design.md`. Favourites use PUT and DELETE, not a toggle. Enquiries have no manual accept route. Contracts stay on `tenancy_contracts` with embedded confirmations. Suspension is not cleared by owner edits and restore does not publish.

