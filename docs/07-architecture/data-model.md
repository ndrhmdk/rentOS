# Data model and database enforcement
Read [dictionary](data-dictionary.md) and [full Mermaid source](database-schema.mmd). All domain primary/foreign keys are UUIDs. `auth_users` denotes managed auth.users only; framework queue/cache and provider internals are not this ERD's complete migrations. property_reviews remains P2 deferred. Do not create contract_versions/contract_confirmations, separate image tables, amenity catalog tables or policy join tables.

## Required constraints
- Normalized unit label unique per property; one current nonarchived listing per property.
- One PENDING rental enquiry per tenant/listing; one PENDING renewal request per tenancy; one tenancy per accepted enquiry.
- GiST EXCLUDE on same unit and intersecting finite blocked dates for PENDING_CONFIRMATION/CONFIRMED/ACTIVE. Convert inclusive end to exclusive end+1day. Do not keep old global UNIQUE(unit_id) allocated rule. No time-dependent index predicate.
- Contract version_number unique per tenancy; predecessor/basis/pending/latest pointers reference the same tenancy through composite FKs and consistency triggers.
- Submitted contract terms/hash/object immutable; only authorized write-once confirmation metadata changes permitted. Owner acknowledged explicitly at insert; tenant confirms OR rejects exact current row/hash before deadline, never both. No blanket trigger that prevents the legitimate first tenant acknowledgement.
- Renewal request may link many unconfirmed corrections; only one mutually confirmed fulfillment through locked action/deferred invariant. Do not UNIQUE the versions' renewal_request_id.
- Scope consistency between property, unit media, preferred unit, cover and tenancy/request tenant. Deferred commit validation for accepted links, confirmations and projected ranges.
- Append-only safe audit log; transactional outbox and replay identity uniqueness; one live report per reporter/listing.

## Favourite extension
```sql
CREATE TABLE favourite_properties (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES user_profiles(id),
    property_id uuid NOT NULL REFERENCES properties(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT favourite_properties_user_property_unique UNIQUE (user_id, property_id)
);
CREATE INDEX favourite_properties_user_pagination
    ON favourite_properties(user_id, created_at DESC, id DESC);
```
Use migrations/namespaces matching real repo schema. Authenticated actor is derived server-side. Save/remove is synchronous and idempotent. Account/property deletion policy follows shared privacy/retention policy; normal archival retains bookmarks with unavailable placeholders. Do not introduce soft-deletion complexity to this simple join by default.

## JSONB defaults
Amenities default to `{"schema_version":1,"standard":{},"custom":[]}`. Validate root schema, catalog scope/enabled/details/custom limits in Laravel. Policies retain property defaults/shared_rules and unit overrides/additional_rules. Keep numeric rent/deposit/duration/occupants typed. Canonical stable keys make JSONB bounded descriptive attributes compatible with a relational core; document this deliberate normalization exception rather than claiming JSONB itself is relational normalization.
