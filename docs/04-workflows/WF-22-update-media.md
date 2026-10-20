# WF-22 Upload select replace or remove photos

Actors: Owner

Requirements: FR09 FR56 FR57 FR59

## Preconditions and trigger
Own property/unit scope. Trigger is the named user action or due system evaluation.

## Main flow
1. Validate bytes/MIME/count/size then upload new unique object.
2. Only completed upload yields selectable row.
3. Swap cover/gallery after success; photo changes need no per-image review.
4. Soft-delete and later purge only unreferenced eligible objects; contracts excluded.

## Alternative and failure flows
- Failed upload keeps old cover; no overwriting referenced bytes.
- Cover removal requires replacement or hide; cleanup rechecks references under lock.

## Postcondition
Consistent selected gallery, audit and safe storage lifecycle.

## Consistency boundary
Use current revisions/Policies and the shared actions; state-changing flows capture audit/outbox/replay where required. A read/favourite is never an allocation authority.
