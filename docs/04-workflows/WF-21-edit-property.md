# WF-21 Edit property and units

Actors: Owner

Requirements: FR08 FR51 FR52 FR55

## Preconditions and trigger
Own inventory. Trigger is the named user action or due system evaluation.

## Main flow
1. Submit editable fields and expected revision.
2. Validate operational state/numeric terms; lock common property content.
3. Audit changed values and bump own/content revisions.
4. First-review snapshot invalidates before approval; later valid content appears directly without reapproval.

## Alternative and failure flows
- Stale409; archive/maintenance races use shared lock.
- Do not alter existing contract terms or auto-cancel occupancies.

## Postcondition
Updated inventory and coherent first-review/public caches.

## Consistency boundary
Use current revisions/Policies and the shared actions; state-changing flows capture audit/outbox/replay where required. A read/favourite is never an allocation authority.
