# WF-24 Withdraw pending enquiry

Actors: Tenant

Requirements: FR28

## Preconditions and trigger
Own pending enquiry. Trigger is the named user action or due system evaluation.

## Main flow
1. Open own enquiry and confirm withdrawal.
2. Lock request and recheck pending.
3. Set WITHDRAWN, audit and notify owner after commit.

## Alternative and failure flows
- Proposal may win first; accepted enquiry directs to tenancy workflow instead.

## Postcondition
No pending thread or reservation side effect.

## Consistency boundary
Use current revisions/Policies and the shared actions; state-changing flows capture audit/outbox/replay where required. A read/favourite is never an allocation authority.
