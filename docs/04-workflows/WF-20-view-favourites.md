# WF-20 View private favourite properties

Actors: Authenticated user

Requirements: FR88

## Preconditions and trigger
Signed in. Trigger is the named user action or due system evaluation.

## Main flow
1. Read paginated own saved relations and private saved-row count.
2. Resolve property current listing through content visibility gate.
3. Return normal card if public-content-visible, even if date availability is zero; show date availability separately.
4. Otherwise return generic unavailable placeholder without hidden content; allow removal.

## Alternative and failure flows
- Account switch clears private caches.
- Saved relation never bypasses suspension/archive/hide; new visible listing for same property reuses same bookmark.

## Postcondition
Private consistent saved list, badge and heart state.

## Consistency boundary
Use current revisions/Policies and the shared actions; state-changing flows capture audit/outbox/replay where required. A read/favourite is never an allocation authority.
