# Requirement and task coverage validation

## Structurally verified during package generation

| Check | Result |
| --- | --- |
| Active requirements | 72 P0/P1 FRs, each with exactly one primary issue |
| Deferred requirements | 8 P2 FRs; no fabricated MVP implementation assignment |
| Scope rule | FR76 documented in RNT-01 and obeyed by all issues |
| Acceptance specifications | 329 unique case IDs; all refer to an existing FR |
| Module coverage | All 81 FRs assigned to exactly one of 10 modules |
| Planning | 16 unique issues; four per Khai/Kien/Hien/Tri; no owner reviews their own issue |
| Dependencies | All references exist; acyclic; topological order generated |
| Course coverage | 24 rubric rows / 10 marks mapped to current issues |
| Mandatory setup | Sanctum + Scramble + Telescope in RNT-01; token implementation RNT-03; alerts RNT-12 |
| Testing policy | Unit/component/API/PostgreSQL integration + manual screen checks; no required E2E suite |
| API typing | Explicit types/tests now; future generator setup docs only |
| Assignments | RNT-07 Tri; RNT-08 Hien; RNT-09 Kien; RNT-10 Khai |

## Source reconciliation

The live task Sheet retains an older label of 324 cases. The current functional workbook has 329 after the full Sanctum/location/favourites reconciliation. This package uses the current workbook’s case definitions and rebuilds issue references to all of them. It does not copy obsolete JWT-only authentication or claim that a historical label overrides newer specifications.

FR74/FR75 are cross-cutting: RNT-01 builds shared safeguards; every state-changing feature applies/tests them. FR47’s primary implementation remains RNT-12 for logs/alerts, while Telescope setup (T5a) is RNT-01. These shared responsibilities are explicit rather than implied by a single primary mapping.

## Not verified by this package

Application source, migrations, auth routes, installed dependencies, code coverage, CI runs, performance numbers, alerts, storage calls, hosted deployment, GitHub publication and member contribution reports. Acceptance cases remain specifications. Test results in a future PR must come from actual code execution, not this document.

## Before closing an issue

Run its meaningful tests against the actual installed stack, record commands/results, review changed UI manually and attach actual evidence. Validate local schema rebuild/upgrade and cross-role data isolation where relevant. Do not postpone everyone’s testing to Phase 4 or treat the reviewer as the implementer.
