# WF-09 Create tenancy proposal

Actors: Owner

Requirements: FR30 FR33 FR34 FR67

## Preconditions and trigger
Pending enquiry; exact ready unit has compatible dates. Trigger is the named user action or due system evaluation.

## Main flow
1. Enter actual negotiated dates/rent/deposit/policy snapshot and private document.
2. Owner explicitly acknowledges exact contract/hash.
3. Lock and validate; create tenancy, ORIGINAL contract, owner confirmation, blocking span and deadline.
4. Atomically accept enquiry, audit/outbox/replay; invite tenant after commit.

## Alternative and failure flows
- GiST overlap or validation failure rolls back request acceptance and hold.
- Other enquiries are not immediately auto-rejected.

## Postcondition
ACCEPTED enquiry plus PENDING_CONFIRMATION tenancy; no mutual agreement yet.

## Consistency boundary
Use current revisions/Policies and the shared actions; state-changing flows capture audit/outbox/replay where required. A read/favourite is never an allocation authority.
