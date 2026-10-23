# Supabase identity plus mandatory Sanctum API tokens

Status: agreed project design; implementation unverified.

## Decision and reason

Teacher Task 4 explicitly requires token management and token scopes/permissions. Supabase-only JWT authorization is superseded. Retain Supabase identity/passwords; verify its JWT at issuance and use finite Sanctum bearer tokens with abilities+Policies on private product APIs. Khai configures package/UUID token storage; Hien implements issuance/rotation/revocation/routes. Cookie-based SPA auth is Laravel’s usual recommendation; the deliberate token bridge satisfies this course design without a second password store.

## Consequences and validation

Apply the owning module requirements and acceptance scenarios; update the related API/data/workflow/issue documents together if the decision changes. Record actual implementation tests and evidence rather than treating this ADR as proof of working code.
