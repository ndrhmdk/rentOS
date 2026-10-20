# WF-26 End or cancel tenancy

Actors: Owner

Requirements: FR66

## Preconditions and trigger
Related confirmed pre-start or active tenancy. Trigger is the named user action or due system evaluation.

## Main flow
1. Require reason and actual lifecycle event.
2. Lock tenancy/pending renewal and transition CANCELLED or ENDED as eligible.
3. Cancel pending work and release only no-longer-needed scheduling block.
4. Keep contracts and accepted enquiry/audit history.

## Alternative and failure flows
- Competing final confirmation/renewal action has one legal result.
- Date expiry alone does not prove physical move-out; overstay requires explicit operational action.

## Postcondition
Historical relationship preserved; scheduling recomputed.

## Consistency boundary
Use current revisions/Policies and the shared actions; state-changing flows capture audit/outbox/replay where required. A read/favourite is never an allocation authority.
