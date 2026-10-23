# WF-06 Search and inspect listings

Actors: Guest or authenticated user

Requirements: FR19 FR20 FR21 FR40 FR77

## Preconditions and trigger
Public discovery. Trigger is the named user action or due system evaluation.

## Main flow
1. Read location (address/ward/district/city), text and full date filters; trim/collapse whitespace and preserve Vietnamese text; label no-date default.
2. Find units meeting combined filters on the same unit and no blocking overlap.
3. Compute eligible count/rent range from same unit set.
4. Display shared/private amenities separately and safe DTOs; preserve location/date/filter/page URL state and independent reset.
5. TanStack Query caches this browser’s reads; Laravel separately invalidates any shared public cache after edits/publication/suspension. Recheck current visibility before returning public data; a cached result is never allocation authority.

## Alternative and failure flows
- Hidden/suspended direct URL denied.
- New competing hold can win after search; result is not a reservation.

## Postcondition
User can inspect candidate and enter rental request or favourite workflow.

## Consistency boundary
Use current revisions/Policies and the shared actions; state-changing flows capture audit/outbox/replay where required. A read/favourite is never an allocation authority.


## Delivery and evidence

See the [traceability matrix](../06-acceptance/traceability-matrix.md) for responsible issues and all acceptance specifications. Private write actions use Sanctum abilities plus Policies; apply audit/idempotency/locking only where the domain action requires them. Manual screen checks complement unit/component/API integration tests; no required E2E suite.
