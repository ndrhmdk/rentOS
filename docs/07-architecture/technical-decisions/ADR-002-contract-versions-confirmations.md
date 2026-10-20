# Immutable tenancy contracts with embedded confirmations

Status: specified design, implementation unverified.

Decision: Use tenancy_contracts for submitted segment versions and write-once owner/tenant timestamps. Protect terms/document/hash while allowing legitimate first acknowledgement; no separate confirmation entity. Corrections append new row and reset confirmation metadata.

Consequences: tests and issue acceptance must reference this behavior; record any approved change here and update affected PRDs/workflows/data/API/acceptance together.
