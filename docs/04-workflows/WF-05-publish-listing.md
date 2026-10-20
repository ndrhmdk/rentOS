# WF-05 Publish listing

Actors: Owner

Requirements: FR17 FR18 FR78

## Preconditions and trigger
Initial approval and complete valid content; not archived/suspended. Trigger is the named user action or due system evaluation.

## Main flow
1. Recheck owner, publication state, cover and current visibility.
2. Check ready marketed eligible inventory for displayed date scope.
3. Set PUBLISHED and invalidate relevant public caches.
4. Use current visibility/availability gates for search and details.

## Alternative and failure flows
- Suspension wins visibility despite concurrent owner publish.
- No suitable inventory must not be presented as available.

## Postcondition
Publication choice separate from first approval and period-specific inventory.

## Consistency boundary
Use current revisions/Policies and the shared actions; state-changing flows capture audit/outbox/replay where required. A read/favourite is never an allocation authority.
