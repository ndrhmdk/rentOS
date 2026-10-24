# Laravel workers and committed-event delivery

Status: agreed project design; implementation unverified.

## Decision and reason

Use database-backed Laravel Queue and workers for the MVP. Commit audit/outbox/replay with domain state and deliver after commit; deduplicate recipient/event keys, bound retries/backoff and recover abandoned leases. Scheduler handles due evaluations through the same domain actions. No Kafka/RabbitMQ or external queue platform is required.

## Consequences and validation

Apply the owning module requirements and acceptance scenarios; update the related API/data/workflow/issue documents together if the decision changes. Record actual implementation tests and evidence rather than treating this ADR as proof of working code.
