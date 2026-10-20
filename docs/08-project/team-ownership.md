# Proposed four-person ownership
Names/handles are not supplied. Member-A/B/C/D are planning aliases, not GitHub usernames. Map real collaborators before assigning issues. User identifies one less experienced teammate; assign that person Member-D only if the team agrees.

| Member | Main responsibilities | Review boundary |
|---|---|---|
| A integration/backend lead | Identity/security, shared schema/actions, core tenancy/reservation/confirmation, PostgreSQL race integrity, course auth decisions, monitoring/CI integration | Reviews all security/transaction/schema-sensitive changes; B reviews A's core work |
| B owner/domain backend | Property/unit/media/policies, listing publication/moderation actions, renewals paired with A, report backend, outbox workers | A reviews allocation/privilege/renewal effects; C reviews UI-facing contracts |
| C tenant/frontend lead | Search/details, favourites, request dashboards, tenancy/renewal UI, frontend tests, resource loading and private/public caching | A/B review API/security expectations; C reviews tenant-facing integration |
| D bounded admin UI owner | First-review table/detail, report queue/detail, required-reason forms, pagination/filter/empty/loading/error states, fixtures, admin UI component tests, README screenshots/demo evidence | A/B provide reviewed endpoints/types and enforce backend access/state. D does not own JWT/admin privilege checks, DB locks/constraints, scheduler or contract logic alone |

Admin is not inherently easiest: authorization bypass, stale approval, suspension races and reporter privacy are critical. Give D small screen-level issues (roughly0.25–0.5day), typed/mock contracts, concrete acceptance and a reviewer. A/B can provide fixture responses before endpoints finish so D can work independently; final integration must use real protected endpoints, not mock-only completion.

Balance by estimated capacity, not number of issues or FRs. A has shared integration risk; B pairs on transactional features and C owns their frontend tests. D's meaningful implementation/tests/reporting work must be traceable for individual assessment, not just cosmetic screenshots. All members write their own commits/PRs and five sprint self-reports.

## Dependency order
Foundation/auth/schema/contracts → owner inventory and public discovery → listing first review/publication → requests and original proposal/mutual confirmation → correction/renewal/cron → integration/concurrency/course evidence. Favourites can proceed after identity/property/public DTO contract, without waiting for complete renewal work. Admin screens can start against agreed fixtures after contracts are defined.
