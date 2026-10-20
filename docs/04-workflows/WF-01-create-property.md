# WF-01 Create property

Actors: Owner

Requirements: FR07 FR08

## Preconditions and trigger
Authenticated owner creates physical inventory, not a public advertisement. Trigger is the named user action or due system evaluation.

## Main flow
1. Enter property fields and WHOLE_SPACE/SEPARATE_UNITS.
2. Persist property under verified owner; permit incomplete draft.
3. WHOLE_SPACE auto-creates exactly one whole-space unit in same transaction.
4. Return owner draft; link to separate unit/media and listing workflows.

## Alternative and failure flows
- Wrong owner rejected; malformed supplied values rejected.
- Replay same operation creates no duplicate; changed payload409.

## Postcondition
Property exists without property approval or public listing.

## Consistency boundary
Use current revisions/Policies and the shared actions; state-changing flows capture audit/outbox/replay where required. A read/favourite is never an allocation authority.
