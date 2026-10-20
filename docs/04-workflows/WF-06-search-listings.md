# WF-06 Search and inspect listings

Actors: Guest or authenticated user

Requirements: FR19 FR20 FR21 FR40 FR77

## Preconditions and trigger
Public discovery. Trigger is the named user action or due system evaluation.

## Main flow
1. Read text/address and full date filters; label no-date default.
2. Find units meeting combined filters on the same unit and no blocking overlap.
3. Compute eligible count/rent range from same unit set.
4. Display shared/private amenities separately and safe DTOs; login before private actions.

## Alternative and failure flows
- Hidden/suspended direct URL denied.
- New competing hold can win after search; result is not a reservation.

## Postcondition
User can inspect candidate and enter enquiry or favourite workflow.

## Consistency boundary
Use current revisions/Policies and the shared actions; state-changing flows capture audit/outbox/replay where required. A read/favourite is never an allocation authority.
