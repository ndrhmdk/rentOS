# rentOS implementation documentation

This is an implementation specification and issue-planning input for a four-person Advanced Web Development team. It follows the teacher's eight-section Markdown documentation hierarchy, adapted from the helpdesk example to property rentals. It is not application code and does not certify that features or tests exist in the repository.

## Read in this order
1. [Source precedence](08-project/source-register.md) and [constraints](08-project/constraints.md).
2. [Product scope](01-product/product-scope.md), [business rules](02-domain/business-rules.md), [state transitions](02-domain/state-transition.md).
3. Your module README and PRD under `03-modules/`, then its referenced independent workflows under `04-workflows/`.
4. [Data model](07-architecture/data-model.md), [API contract](07-architecture/api-design.md) and [test scenarios](06-acceptance/test-scenarios.md).
5. [Course compliance](08-project/course-compliance.md), [team ownership](08-project/team-ownership.md), and [issue authoring contract](08-project/issue-authoring.md).

The full requirements and acceptance catalogue is retained in `06-acceptance/requirements-catalog.md` and `acceptance-cases.md`. Current baseline: **81 active specification rows and 324 acceptance cases**: workbook version3 contributes80/314; newly requested FR88 favourites contributes1/10. This does not silently rewrite the earlier workbook. Original FR priorities and IDs are retained; retired IDs are not reused.

Use Next.js frontend, Laravel API and Supabase PostgreSQL/Auth/Storage. The user reports teacher approval for that stack. Exact replacement of named Blade/Livewire/Sanctum grading items is not evidenced; record that distinction rather than implementing two authentication systems.

Do not rename `tenancy_contracts`, `tenancy_renewal_requests`, `audit_logs` or `notifications`. Contract confirmation timestamps live inside `tenancy_contracts`.
