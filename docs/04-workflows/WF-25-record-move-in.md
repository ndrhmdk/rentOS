# WF-25 Record actual move-in

Actors: Owner

Requirements: FR80

## Preconditions and trigger
Confirmed original agreement and start date reached. Trigger is the named user action or due system evaluation.

## Main flow
1. Recheck same tenancy current lifecycle.
2. Record moved_in_at and set ACTIVE.
3. Audit without changing agreement/blocking period.

## Alternative and failure flows
- Before start/unconfirmed/cancelled denied; cancellation race serialized.

## Postcondition
Actual move-in recorded, not inferred from clock.

## Consistency boundary
Use current revisions/Policies and the shared actions; state-changing flows capture audit/outbox/replay where required. A read/favourite is never an allocation authority.
