# Architecture overview
Controllers/FormRequests/API Resources are thin. Shared action/services own proposals, confirmation, renewal, expiry,15day decisions, initial moderation and visibility. Queue and HTTP paths reuse them; avoid duplicated transition logic.

Use database transactions, fixed lock order and final DB constraints. Availability is a query/projection and never a mutable decrementing count. Media bytes are uploaded before committing references; incomplete orphan cleanup is compensating work, not a DB transaction pretending to roll back remote storage.

Next.js/TanStack Query treats search as indicative. Private profile/favourite/request/contract caches are scoped by authenticated account and cleared on logout; public caches never contain private flags. Frontend writes include expected revisions or stable operation UUIDs where specified. Favourite PUT/DELETE supplies intended state rather than an ambiguous toggle.

Repository layout/versioned packages/hosting are discovered locally. Suggested frontend/backend boundaries are logical, not a claim that directories with those names exist. One person coordinates migrations/API contracts; feature owners avoid overlapping unreviewed foundation changes.
