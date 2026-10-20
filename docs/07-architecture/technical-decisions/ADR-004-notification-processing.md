# Durable after-commit notifications

Status: specified design, implementation unverified.

Decision: Store outbox intent atomically with domain/audit; database Laravel Queue plus worker/scheduler for MVP. Retry/dedupe and redacted failures; delivery outage does not roll back committed domain result.

Consequences: tests and issue acceptance must reference this behavior; record any approved change here and update affected PRDs/workflows/data/API/acceptance together.
