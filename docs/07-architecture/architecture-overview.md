# Architecture overview

| Boundary | Responsibility |
| --- | --- |
| Next.js | Landing/search/detail, owner/tenant/admin screens, TanStack Query browser state, explicit API response types |
| Supabase Auth | Sign-up, sign-in, email confirmation, provider identity refresh/recovery |
| Laravel + Sanctum | Identity-to-token issuance, private route auth/abilities/Policies, FormRequests/Resources and business actions |
| PostgreSQL | Relational persistence, UUID ownership/scope links, uniqueness, date exclusion, append-only/write-once and commit invariants |
| Storage | Validated completed public media and private immutable agreement documents; provider failures handled explicitly |
| Queue/scheduler | Transactional outbox, private notifications, due holds/renewals, 15-day decisions and unreferenced-file deletion |
| Scramble/Telescope | Required API documentation and restricted diagnostics; installed/configured by Khai in RNT-01 |

## Suggested code boundaries (verify actual repository paths)

Controllers should orchestrate FormRequest → Policy/ability → transactional domain action → Resource. Reuse the same domain action in HTTP/worker paths; do not duplicate state transitions in controllers and cron. Derive actor from trusted authentication. Use factories and deterministic local seed data so another member can implement a feature without waiting for all other screens.

All initial migrations and shared tooling are RNT-01. Feature owners author later reviewed additive migrations for new persisted fields, run them locally, and update response contracts. A UI label rename alone does not require renaming a stored column.

The exact monorepo directories/package versions are unverified. Do not claim backend/frontend folders, CI workflows or tests already exist simply because this document proposes them.
