# Database-enforced period allocation

Status: specified design, implementation unverified.

Decision: Use GiST exclusion on finite blocked ranges; confirmed projection plus current proposal extension. Allow adjacent future tenancies. Shared actions and deferred projection checks complement exclusion.

Consequences: tests and issue acceptance must reference this behavior; record any approved change here and update affected PRDs/workflows/data/API/acceptance together.
