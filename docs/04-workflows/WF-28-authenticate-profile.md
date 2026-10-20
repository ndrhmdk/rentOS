# WF-28 Authenticate and manage profile

Actors: Guest/user

Requirements: FR01 FR02 FR04 FR05 FR06 FR43 FR49

## Preconditions and trigger
Configured Supabase project. Trigger is the named user action or due system evaluation.

## Main flow
1. Register/confirm email/login or provider recovery.
2. Laravel verifies JWT signature/project claims and profile eligibility.
3. Run resource policy on each private action; update permitted profile fields with revision.
4. Logout clears private client data; document expiry-bound copied JWT behavior.

## Alternative and failure flows
- No self-granted admin; no duplicate password store.
- Unknown signing key bounded refresh then fail closed; no token-supplied key URL.

## Postcondition
One verified identity/profile with tenant and owner capability.

## Consistency boundary
Use current revisions/Policies and the shared actions; state-changing flows capture audit/outbox/replay where required. A read/favourite is never an allocation authority.
