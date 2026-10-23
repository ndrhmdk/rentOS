# Security design

Read [security NFRs](../05-non-functional-requirements/security.md) and [identity ADR](technical-decisions/ADR-001-identity-and-sanctum.md).

| Boundary | Required control | Negative test |
| --- | --- | --- |
| Identity issuance | Trusted Supabase signature/project/expiry/subject, account eligibility, rate limit | Forged/wrong-project/expired JWT, arbitrary kid URL, concurrent bootstrap |
| Product API | Actual Sanctum token, finite expiry/revocation and required ability | Provider JWT alone, missing/expired/revoked token, read-only token attempting write |
| Resource | Current ownership/participant/admin Policy | Foreign UUID, forged owner_id/is_admin, removed admin privilege despite token ability |
| Public reads | Current visibility gate and safe Resource shape | Suspended/hidden direct URL or shared-cache leak |
| Private objects | Authorized immutable upload/reference/hash and short-lived download capabilities | Other participant/outsider, wrong hash/version, tokens in logs |
| Diagnostics | Local or explicitly restricted non-local Telescope, payload/query filtering | Guest/ordinary user, bearer/recovery/password/contact leakage |
| Database | Private schema/roles/grants; constraints and immutable/write-once rules | Direct Data API write, cross-scope FKs, overlap or mutable agreed terms |
| Browser cache | Account-scoped queries, clear/cancel old state on switch | Prior user’s favourite/contact/contract appears after sign-out |

Supabase sign-out alone cannot instantly revoke a separately issued Sanctum token; Laravel revocation is explicit. Likewise offline JWT checks do not establish instant provider-session revocation. Finite token expiry limits the gap. No second password store is introduced. If cookie-authenticated functionality is added, configure CSRF/CORS/session rules for that path rather than assuming bearer conventions apply.
