# Proposed API contract

These are target contracts, not verified existing routes. Discover actual repository routing before issue creation; preserve compatible existing patterns and document any change. CRUD stands for resource collection/detail create/read/update/archive operations and must be expanded into actual HTTP routes in Scramble. No toggle endpoint for favourites and no manual rental-request Accept endpoint.

| Method | Target route | Actor | Behavior |
| --- | --- | --- | --- |
| GET | /api/v1/listings | Public | Current visibility and full interval/same-unit filters; paginated safe DTO |
| GET | /api/v1/listings/{listing} | Public | Hidden/suspended/unapproved unavailable; no tenant contacts/private contracts |
| GET | /api/v1/amenities | Public | Code-managed stable catalog labels/aliases/scopes; no arbitrary catalog POST |
| GET/PATCH | /api/v1/me/profile | Authenticated | Own permitted fields; revision checked; admin fields forbidden |
| CRUD | /api/v1/properties | Owner | Resource Controller/FormRequest/Policy; archive referenced records |
| CRUD | /api/v1/properties/{property}/units | Owner | Whole-space guard; same-property normalized labels |
| POST | /api/v1/properties/{property}/units/bulk | Owner | Atomic complete preview rows with individual retry keys |
| POST/PATCH/DELETE | /api/v1/properties/{property}/media | Owner | Completed validated upload, scope, selection and safe removal |
| POST/PATCH | /api/v1/properties/{property}/listing | Owner | One current property listing; expected revision |
| POST | /api/v1/listings/{listing}/submit | Owner | First review submission snapshot |
| POST | /api/v1/listings/{listing}/publish | Owner | Approved/complete/not suspended |
| POST | /api/v1/listings/{listing}/hide | Owner | Owner publication only |
| POST | /api/v1/listings/{listing}/rental-requests | Tenant | Private contact snapshots; request PENDING, no hold |
| GET | /api/v1/me/rental-requests | Tenant | Own requests only |
| GET | /api/v1/owner/rental-requests | Owner | Only managed-property contacts |
| POST | /api/v1/rental-requests/{request}/withdraw | Tenant | Only PENDING to WITHDRAWN |
| POST | /api/v1/rental-requests/{request}/reject | Owner | Required reason; PENDING only |
| POST | /api/v1/rental-requests/{request}/tenancy-proposal | Owner | Version+owner ack+hold+acceptance atomic |
| GET | /api/v1/tenancies/{tenancy} | Related parties | Private agreement timeline and effective segment |
| POST | /api/v1/tenancies/{tenancy}/contract-proposals | Owner | New corrected immutable row; reacquire compatible dates |
| POST | /api/v1/tenancy-contracts/{contract}/confirm | Tenant | Exact current UUID/hash, deadline, write-once |
| POST | /api/v1/tenancy-contracts/{contract}/reject | Tenant | Exact current contract, reason; proposed hold release |
| GET | /api/v1/tenancy-contracts/{contract}/document | Related parties | Authorize before short-lived private download |
| POST | /api/v1/tenancies/{tenancy}/move-in | Owner | CONFIRMED and start reached |
| POST | /api/v1/tenancies/{tenancy}/end | Owner | Actual ending, reason, preserve historical terms |
| POST | /api/v1/tenancies/{tenancy}/cancel | Owner | Eligible cancellation, reason, serialized pending work |
| POST | /api/v1/tenancies/{tenancy}/renewal-requests | Tenant | One PENDING renewal, no extension yet |
| POST | /api/v1/tenancy-renewal-requests/{renewal}/contract-proposals | Owner | Consecutive extension hold; request still pending |
| POST | /api/v1/tenancy-renewal-requests/{renewal}/withdraw | Tenant | Pending only, release unconfirmed extension |
| POST | /api/v1/tenancy-renewal-requests/{renewal}/reject | Owner | Reason, confirmed original unaffected |
| GET | /api/v1/me/favourite-properties | Authenticated | Private paginated saved rows and count; unavailable stubs safe |
| GET | /api/v1/me/favourite-properties/ids | Authenticated | Capped property-id batch for hearts; account-private response |
| PUT | /api/v1/me/favourite-properties/{property} | Authenticated | Save intended state; first201/existing200; current public-content gate |
| DELETE | /api/v1/me/favourite-properties/{property} | Authenticated | Remove own intended state; repeated204 even if target now hidden |
| POST | /api/v1/listings/{listing}/reports | Authenticated | One live report; synchronous persistence; rate limit |
| GET | /api/v1/me/reports | Reporter | Own sanitized outcome only |
| GET | /api/v1/admin/listing-submissions | Admin | First-review queue/detail |
| POST | /api/v1/admin/listings/{listing}/approve | Admin | Expected listing/content revisions |
| POST | /api/v1/admin/listings/{listing}/reject | Admin | Reason; exact pending snapshot |
| POST | /api/v1/admin/listings/{listing}/suspend | Admin | Separate restriction; reason and audit |
| POST | /api/v1/admin/listings/{listing}/restore | Admin | Explicit restriction removal, no owner republish |
| GET | /api/v1/admin/reports | Admin | Bounded investigation queue/detail |
| POST | /api/v1/admin/reports/{report}/review | Admin | OPEN to REVIEWING |
| POST | /api/v1/admin/reports/{report}/resolve | Admin | Reason and sanitized outcome; optional suspend atomic |
| POST | /api/v1/admin/reports/{report}/dismiss | Admin | Reasoned terminal decision |
| GET | /api/v1/me/notifications | Authenticated | Own inbox if P1 delivered |
| POST | /api/v1/me/notifications/{notification}/read | Recipient | Idempotent read state |


## Payloads and errors
JSON writes use validated fields; actor identity never comes from user_id in body. Mutations with revisions use expected_revision (or repository-equivalent documented field); stale409. Scoped operation UUID and payload hash protect create/retry actions; do not treat a UUID alone as authorization.

Enquiry payload: contact_name, contact_phone, desired_move_in_date, desired_end_date, message, optional preferred_unit_id, client_operation_id. Contract proposal: unit/date terms, monthly_rent/deposit_amount, actual policies_snapshot, private staged document reference/hash, optional signed_on, explicit owner acknowledgement, expected revisions and retry key. Confirmation: exact contract resource, matching document_sha256 and expected tenancy revision. Never allow clients to submit confirmation timestamps or is_admin directly.

Common status:401 unauthenticated,403 unauthorized (or404 to avoid existence disclosure),404 unavailable,409 state/revision/overlap conflict,422 field validation,429 throttled,503 controlled external service failure. Use consistent error schema and correlation ID without secrets. List endpoints paginate and batch eager-loaded relationships; no N+1 property/unit/media queries.

Favourites endpoints use Cache-Control private/no-store as appropriate; never place user-specific is_favourite in a shared cached listing DTO. A public card can be combined client-side with a private capped favourite-id response. Badge counts saved relations including unavailable placeholders. Calls are not sent to queues. Parallel devices converge to last DB-committed intended state; do not promise a global ordering from browser click timestamps.

Generate OpenAPI from real controllers with Scramble, including custom bearer security if approved. A handwritten route table is not the course documentation evidence.
