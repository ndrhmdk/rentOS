# WF-19 Save or remove favourite property

Actors: Authenticated user

Requirements: FR88

## Preconditions and trigger
Property card/detail visible; known property UUID. Trigger is the named user action or due system evaluation.

## Main flow
1. Guest goes to login without anonymous server save.
2. Send PUT for desired saved or DELETE for desired unsaved; actor from JWT.
3. Persist unique user/property or delete own pair synchronously.
4. Update account-scoped heart/badge; serialize quick per-property writes and refetch.

## Alternative and failure flows
- Duplicate PUT one row; repeated DELETE204.
- On error revert/refetch UI; late response cannot override newer local intent.

## Postcondition
Saved property survives reload or is removed; no reservation/contact effect.

## Consistency boundary
Use current revisions/Policies and the shared actions; state-changing flows capture audit/outbox/replay where required. A read/favourite is never an allocation authority.
