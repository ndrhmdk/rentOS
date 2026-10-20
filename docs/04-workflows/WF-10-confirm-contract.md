# WF-10 Confirm or decline exact contract

Actors: Tenant

Requirements: FR81 FR82 FR86

## Preconditions and trigger
Current pending contract; owner acknowledged; before deadline. Trigger is the named user action or due system evaluation.

## Main flow
1. Display exact row UUID/hash/document and proposed terms.
2. Lock tenancy and check participant/pointer/hash/server time.
3. Write tenant confirmation once OR tenant rejection/reason once.
4. Confirm original to CONFIRMED or promote renewal span/request acceptance; decline releases proposed-only hold.

## Alternative and failure flows
- Old version confirmation409; at/after deadline denied.
- Competing correction/expiry/cancel yields one valid state; never mixed-version acknowledgements.

## Postcondition
Exact-row mutual agreement or retained decline; embedded fields, no confirmation table.

## Consistency boundary
Use current revisions/Policies and the shared actions; state-changing flows capture audit/outbox/replay where required. A read/favourite is never an allocation authority.
