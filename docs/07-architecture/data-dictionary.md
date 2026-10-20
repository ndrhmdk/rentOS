# Data dictionary

Baseline workbook229 columns plus4 FR88 columns =233 columns across17 entities, including managed auth reference and optional/support entities. This count is descriptive, not a mandate to implement deferred reviews.

| Entity | Scope | Column | PostgreSQL type | Key | Nullable | Default | Description |
| --- | --- | --- | --- | --- | --- | --- | --- |
| auth_users | Managed external | id | uuid | PK | No |  | Provider managed identity UUID |
| auth_users | Managed external | email | text |  | Yes |  | Provider managed email; password/session internals intentionally omitted |
| user_profiles | Core | id | uuid | PK,FK | No |  | References auth.users.id; one profile per identity |
| user_profiles | Core | full_name | text |  | No |  | Validated display/contact name |
| user_profiles | Core | phone | text |  | Yes |  | Optional contact number; not OTP ownership verification |
| user_profiles | Core | is_admin | boolean |  | No | false | Trusted server-managed moderation privilege |
| user_profiles | Core | account_status | text |  | No | ACTIVE | ACTIVE or SUSPENDED |
| user_profiles | Core | revision | integer |  | No | 1 | Optimistic concurrency version |
| user_profiles | Core | created_at | timestamptz |  | No | now() | Record creation time in UTC |
| user_profiles | Core | updated_at | timestamptz |  | No | now() | Last record update time in UTC |
| properties | Core | id | uuid | PK | No | gen_random_uuid() | Application UUID |
| properties | Core | owner_id | uuid | FK | No |  | Authorized manager profile; MVP one owner |
| properties | Core | client_operation_id | uuid |  | No |  | Idempotent create key scoped to owner |
| properties | Core | name | text |  | No |  | Property name |
| properties | Core | property_type | text |  | No |  | HOUSE APARTMENT APARTMENT_BUILDING |
| properties | Core | rental_arrangement | text |  | No |  | WHOLE_SPACE or SEPARATE_UNITS |
| properties | Core | address_line | text |  | Yes |  | Street and building address; may be null in incomplete draft, required at listing submission/publication |
| properties | Core | ward | text |  | Yes |  | Optional local ward |
| properties | Core | district | text |  | Yes |  | Searchable district or area; may be null in incomplete draft, required at listing submission/publication |
| properties | Core | city | text |  | Yes |  | City; may be null in incomplete draft, required at listing submission/publication |
| properties | Core | description | text |  | Yes |  | Shared property description; may be null in incomplete draft, required at listing submission/publication |
| properties | Core | shared_amenities | jsonb |  | No | {"schema_version":1,"standard":{},"custom":[]} | Shared property facilities. Controlled JSONB {schema_version:1,standard:{catalog_key:{enabled:boolean,details?:text}},custom:[text]}. Standard keys/scopes from Laravel catalog; canonical labels from catalog, no owner_label. Custom text NFC/trim/whitespace-normalized and deduplicated locally using case folding; never auto-promoted to standard search keys. Absent key means not advertised. |
| properties | Core | policies | jsonb |  | No |  | schema_version defaults pets/smoking and shared_rules |
| properties | Core | content_revision | integer |  | No | 1 | Increment on property/unit/media/policy content writes; initial listing stale-review guard |
| properties | Core | latitude | numeric |  | Yes |  | Optional geocoding latitude -90 to90 |
| properties | Core | longitude | numeric |  | Yes |  | Optional longitude -180 to180 |
| properties | Core | archived_at | timestamptz |  | Yes |  | Archive instead of destructive delete |
| properties | Core | created_at | timestamptz |  | No | now() | Record creation time in UTC |
| properties | Core | updated_at | timestamptz |  | No | now() | Last record update time in UTC |
| properties | Core | revision | integer |  | No | 1 | Stale property write version |
| units | Core | id | uuid | PK | No | gen_random_uuid() | Stable unit UUID |
| units | Core | property_id | uuid | FK | No |  | Parent property |
| units | Core | client_operation_id | uuid |  | No |  | Per-preview-row idempotency UUID; unique with property_id, including bulk rows |
| units | Core | label | text |  | No |  | Room S201 or Entire property; normalized label unique per property |
| units | Core | unit_kind | text |  | No |  | ROOM STUDIO APARTMENT HOUSE |
| units | Core | description | text |  | Yes |  | Unit specific description; may be null in incomplete draft, required at listing submission/publication |
| units | Core | floor | text |  | Yes |  | Flexible floor label |
| units | Core | area_m2 | numeric |  | Yes |  | Positive floor area; may be null in incomplete draft, required at listing submission/publication |
| units | Core | bedrooms | integer |  | No |  | Nonnegative; room/studio may use0 |
| units | Core | bathrooms | numeric |  | No |  | Nonnegative count |
| units | Core | bathroom_arrangement | text |  | No |  | PRIVATE or SHARED |
| units | Core | amenities | jsonb |  | No | {"schema_version":1,"standard":{},"custom":[]} | Features inside the individual unit. Controlled JSONB {schema_version:1,standard:{catalog_key:{enabled:boolean,details?:text}},custom:[text]}. Standard keys/scopes from Laravel catalog; canonical labels from catalog, no owner_label. Custom text NFC/trim/whitespace-normalized and deduplicated locally using case folding; never auto-promoted to standard search keys. Absent key means not advertised. |
| units | Core | advertised_monthly_rent | numeric |  | Yes |  | Positive NUMERIC(14,0) VND; not agreed contract rent; may be null in incomplete draft, required at listing submission/publication |
| units | Core | deposit | numeric |  | Yes |  | Nonnegative NUMERIC(14,0) VND; may be null in incomplete draft, required at listing submission/publication |
| units | Core | minimum_rental_months | integer |  | No |  | At least3 |
| units | Core | max_occupants | integer |  | Yes |  | Positive occupancy limit; may be null in incomplete draft, required at listing submission/publication |
| units | Core | operational_status | text |  | No | READY | READY MAINTENANCE RETIRED |
| units | Core | is_marketed | boolean |  | No | false | Explicit owner advertising choice; enable only with complete required unit data |
| units | Core | policy_overrides | jsonb |  | No | {} | Allowed enum overrides and additional_rules |
| units | Core | revision | integer |  | No | 1 | Stale write check |
| units | Core | archived_at | timestamptz |  | Yes |  | Preserve historical references |
| units | Core | created_at | timestamptz |  | No | now() | Record creation time in UTC |
| units | Core | updated_at | timestamptz |  | No | now() | Last record update time in UTC |
| property_media | Core | id | uuid | PK | No | gen_random_uuid() | Photo UUID; no review or replacement-chain state |
| property_media | Core | property_id | uuid | FK | No |  | Parent property |
| property_media | Core | unit_id | uuid | FK | Yes |  | Optional unit in same property |
| property_media | Core | uploaded_by | uuid | FK | No |  | Authorized uploader |
| property_media | Core | client_operation_id | uuid |  | No |  | Uploader scoped submission key |
| property_media | Core | storage_path | text | UK | No |  | Unique object path; no overwriting referenced bytes |
| property_media | Core | caption | text |  | Yes |  | Owner caption; plain text, audited |
| property_media | Core | sort_order | integer |  | No | 0 | Gallery order |
| property_media | Core | is_selected_for_listing | boolean |  | No | true | Display intent independent of approval |
| property_media | Core | revision | integer |  | No | 1 | Stale gallery edit protection |
| property_media | Core | purged_at | timestamptz |  | Yes |  | Storage file deletion confirmed |
| property_media | Core | created_at | timestamptz |  | No | now() | Record creation time in UTC |
| property_media | Core | updated_at | timestamptz |  | No | now() | Last record update time in UTC |
| property_media | Core | deleted_at | timestamptz |  | Yes |  | Soft removal; hidden from gallery; retention starts |
| property_media | Core | sha256 | text |  | No |  | Hash of completed image bytes for audit integrity |
| property_media | Core | mime_type | text |  | No |  | Validated decoded image media type |
| property_media | Core | size_bytes | bigint |  | No |  | Positive completed file byte count |
| listings | Core | id | uuid | PK | No | gen_random_uuid() | Listing UUID |
| listings | Core | property_id | uuid | FK | No |  | One nonarchived listing per property |
| listings | Core | client_operation_id | uuid |  | No |  | Property scoped create identity |
| listings | Core | title | text |  | No |  | Public title |
| listings | Core | description | text |  | No |  | Advertisement copy |
| listings | Core | cover_media_id | uuid | FK | Yes |  | Selected nondeleted same-property shared media; required to publish |
| listings | Core | moderation_status | text |  | No | DRAFT | DRAFT PENDING APPROVED REJECTED |
| listings | Core | publication_status | text |  | No | DRAFT | DRAFT PUBLISHED HIDDEN |
| listings | Core | revision | integer |  | No | 1 | Listing optimistic revision; initial submission snapshot |
| listings | Core | submitted_revision | integer |  | Yes |  | Listing revision awaiting review |
| listings | Core | submitted_at | timestamptz |  | Yes |  | Review request time |
| listings | Core | reviewed_by | uuid | FK | Yes |  | Admin reviewer |
| listings | Core | reviewed_at | timestamptz |  | Yes |  | Decision time |
| listings | Core | review_reason | text |  | Yes |  | Required rejection or suspension reason |
| listings | Core | archived_at | timestamptz |  | Yes |  | Historical listing |
| listings | Core | created_at | timestamptz |  | No | now() | Record creation time in UTC |
| listings | Core | updated_at | timestamptz |  | No | now() | Last record update time in UTC |
| listings | Core | submitted_content_revision | integer |  | Yes |  | Property content_revision captured at initial submission |
| listings | Core | approved_content_revision | integer |  | Yes |  | Historical revision initially approved; later edits need not equal it |
| listings | Core | admin_suspended_at | timestamptz |  | Yes |  | Admin restriction independent of initial approval and owner publication |
| listings | Core | admin_suspended_by | uuid | FK | Yes |  | Suspending admin profile |
| listings | Core | suspension_reason | text |  | Yes |  | Required while admin-suspended |
| rental_requests | Core | id | uuid | PK | No | gen_random_uuid() | Enquiry UUID |
| rental_requests | Core | listing_id | uuid | FK | No |  | Source listing |
| rental_requests | Core | tenant_id | uuid | FK | No |  | Authenticated prospect |
| rental_requests | Core | preferred_unit_id | uuid | FK | Yes |  | Optional preference in listing property |
| rental_requests | Core | client_operation_id | uuid |  | No |  | Tenant scoped create identity |
| rental_requests | Core | desired_move_in_date | date |  | No |  | Preference not contractual start |
| rental_requests | Core | message | text |  | No |  | Enquiry text |
| rental_requests | Core | status | text |  | No | PENDING | PENDING ACCEPTED REJECTED WITHDRAWN; ACCEPTED means tenancy proposal committed |
| rental_requests | Core | outcome_reason | text |  | Yes |  | Required rejection/automatic closure explanation |
| rental_requests | Core | revision | integer |  | No | 1 | Concurrent state guard |
| rental_requests | Core | created_at | timestamptz |  | No | now() | Record creation time in UTC |
| rental_requests | Core | updated_at | timestamptz |  | No | now() | Last record update time in UTC |
| rental_requests | Core | contact_name | text |  | No |  | Private submitted contact snapshot |
| rental_requests | Core | contact_phone | text |  | No |  | Private normalized phone snapshot; no OTP verification |
| rental_requests | Core | desired_end_date | date |  | No |  | Inclusive end of requested period; required to assess actual availability |
| rental_requests | Core | availability_checked_at | timestamptz |  | Yes |  | Last due15-day evaluation timestamp |
| rental_requests | Core | closed_at | timestamptz |  | Yes |  | Terminal request transition time |
| tenancies | Core | id | uuid | PK | No | gen_random_uuid() | Tenancy UUID |
| tenancies | Core | unit_id | uuid | FK | No |  | Exact allocated unit |
| tenancies | Core | tenant_id | uuid | FK | No |  | Primary tenant matches original enquiry |
| tenancies | Core | rental_request_id | uuid | FK,UK | No |  | One result per accepted enquiry |
| tenancies | Core | client_operation_id | uuid |  | No |  | Owner scoped record action identity |
| tenancies | Core | status | text |  | No | PENDING_CONFIRMATION | PENDING_CONFIRMATION AWAITING_REVISION CONFIRMED ACTIVE EXPIRED CANCELLED ENDED |
| tenancies | Core | actual_ended_at | timestamptz |  | Yes |  | Actual move-out/end or cancellation action |
| tenancies | Core | end_reason | text |  | Yes |  | Required when ending/cancelling |
| tenancies | Core | revision | integer |  | No | 1 | Concurrent lifecycle guard |
| tenancies | Core | created_at | timestamptz |  | No | now() | Record creation time in UTC |
| tenancies | Core | updated_at | timestamptz |  | No | now() | Last record update time in UTC |
| tenancies | Core | owner_id | uuid | FK | No |  | Manager party snapshot for contract confirmation |
| tenancies | Core | confirmed_start_date | date |  | Yes |  | Projection: first mutually confirmed segment start |
| tenancies | Core | confirmed_end_date | date |  | Yes |  | Projection: last mutually confirmed consecutive segment end |
| tenancies | Core | blocked_start_date | date |  | Yes |  | Blocking envelope start, includes proposed original/confirmed span |
| tenancies | Core | blocked_end_date | date |  | Yes |  | Blocking envelope end, includes pending renewal extension |
| tenancies | Core | pending_contract_id | uuid | FK | Yes |  | Current unconfirmed version in same tenancy; composite FK |
| tenancies | Core | latest_confirmed_contract_id | uuid | FK | Yes |  | Latest mutually confirmed segment version in same tenancy |
| tenancies | Core | confirmation_expires_at | timestamptz |  | Yes |  | Server deadline for current pending version only |
| tenancies | Core | moved_in_at | timestamptz |  | Yes |  | Owner-reported actual move-in event time |
| tenancy_renewal_requests | Core | id | uuid | PK | No | gen_random_uuid() | Renewal request UUID |
| tenancy_renewal_requests | Core | tenancy_id | uuid | FK | No |  | Existing CONFIRMED or ACTIVE continuing tenancy |
| tenancy_renewal_requests | Core | client_operation_id | uuid |  | No |  | Tenancy scoped submission identity |
| tenancy_renewal_requests | Core | requested_end_date | date |  | No |  | Proposed later end date |
| tenancy_renewal_requests | Core | proposed_monthly_rent | numeric |  | No |  | Positive NUMERIC(14,0) VND |
| tenancy_renewal_requests | Core | message | text |  | Yes |  | Tenant explanation |
| tenancy_renewal_requests | Core | status | text |  | No | PENDING | PENDING ACCEPTED REJECTED CANCELLED |
| tenancy_renewal_requests | Core | reviewed_by | uuid | FK | Yes |  | Owner for rejection; acceptance derives from final mutual confirmation |
| tenancy_renewal_requests | Core | reviewed_at | timestamptz |  | Yes |  | Outcome time |
| tenancy_renewal_requests | Core | review_reason | text |  | Yes |  | Required for rejection |
| tenancy_renewal_requests | Core | revision | integer |  | No | 1 | Terminal action concurrency |
| tenancy_renewal_requests | Core | created_at | timestamptz |  | No | now() | Record creation time in UTC |
| tenancy_renewal_requests | Core | updated_at | timestamptz |  | No | now() | Last record update time in UTC |
| tenancy_contracts | Core | id | uuid | PK | No | gen_random_uuid() | Immutable version UUID |
| tenancy_contracts | Core | tenancy_id | uuid | FK | No |  | Parent continuous tenancy |
| tenancy_contracts | Core | version_number | integer |  | No |  | Monotonic per tenancy; unique with tenancy_id |
| tenancy_contracts | Core | type | text |  | No |  | ORIGINAL or RENEWAL; corrections preserve type |
| tenancy_contracts | Core | renewal_request_id | uuid | FK | Yes |  | For RENEWAL segment and corrections; many versions may share request |
| tenancy_contracts | Core | supersedes_contract_id | uuid | FK | Yes |  | Previous unconfirmed version in same tenancy/segment; no confirmed amendment MVP |
| tenancy_contracts | Core | basis_contract_id | uuid | FK | Yes |  | Confirmed preceding segment for renewal; null for original |
| tenancy_contracts | Core | start_date | date |  | No |  | Inclusive segment start; renewal starts prior confirmed end+1 |
| tenancy_contracts | Core | end_date | date |  | No |  | Inclusive segment end |
| tenancy_contracts | Core | monthly_rent | numeric |  | No |  | NUMERIC(14,0) positive VND applicable to this segment |
| tenancy_contracts | Core | deposit_amount | numeric |  | No |  | NUMERIC(14,0) nonnegative agreed deposit; do not double-charge on renewal |
| tenancy_contracts | Core | policies_snapshot | jsonb |  | No |  | Required actually negotiated resolved policies snapshot |
| tenancy_contracts | Core | document_path | text | UK | No |  | Private unique immutable object path; protect bytes from overwrite/delete |
| tenancy_contracts | Core | document_sha256 | text |  | No |  | SHA256 of exact stored document bytes |
| tenancy_contracts | Core | signed_on | date |  | Yes |  | Optional owner-reported offline signing date, not platform verified |
| tenancy_contracts | Core | created_by | uuid | FK | No |  | Owner creating and explicitly acknowledging proposal |
| tenancy_contracts | Core | created_at | timestamptz |  | No | now() | Version inserted time in UTC |
| tenancy_contracts | Core | owner_confirmed_at | timestamptz |  | No |  | Explicit owner acknowledgement of this exact contract UUID and document hash; set at proposal submission; never rewritten |
| tenancy_contracts | Core | tenant_confirmed_at | timestamptz |  | Yes |  | Tenant acknowledgement of this exact contract UUID/hash; write once from null; excludes rejection |
| tenancy_contracts | Core | tenant_rejected_at | timestamptz |  | Yes |  | Tenant decline of this exact contract; write once from null; excludes confirmation |
| tenancy_contracts | Core | tenant_rejection_reason | text |  | Yes |  | Required when tenant declines; written with tenant_rejected_at and never rewritten |
| listing_reports | Core | id | uuid | PK | No | gen_random_uuid() | Report UUID |
| listing_reports | Core | listing_id | uuid | FK | No |  | Reported advertisement |
| listing_reports | Core | reporter_id | uuid | FK | No |  | Authenticated reporter |
| listing_reports | Core | client_operation_id | uuid |  | No |  | Reporter scoped submission key |
| listing_reports | Core | reason_code | text |  | No |  | FRAUD MISLEADING HARMFUL OTHER |
| listing_reports | Core | description | text |  | No |  | Reporter explanation |
| listing_reports | Core | status | text |  | No | OPEN | OPEN REVIEWING RESOLVED DISMISSED |
| listing_reports | Core | resolution_summary | text |  | Yes |  | Sanitized reporter-visible outcome |
| listing_reports | Core | internal_notes | text |  | Yes |  | Admin only investigation details |
| listing_reports | Core | reviewed_by | uuid | FK | Yes |  | Admin deciding |
| listing_reports | Core | reviewed_at | timestamptz |  | Yes |  | Decision time |
| listing_reports | Core | revision | integer |  | No | 1 | Concurrent reviewer guard |
| listing_reports | Core | created_at | timestamptz |  | No | now() | Record creation time in UTC |
| listing_reports | Core | updated_at | timestamptz |  | No | now() | Last record update time in UTC |
| audit_logs | Core | id | uuid | PK | No | gen_random_uuid() | Audit UUID |
| audit_logs | Core | actor_id | uuid | FK | Yes |  | Null for explicit system action |
| audit_logs | Core | entity_type | text |  | No |  | Allowlisted table/resource kind |
| audit_logs | Core | entity_id | uuid |  | No |  | Polymorphic UUID validated by backend; not a SQL FK |
| audit_logs | Core | action | text |  | No |  | Transition/action name |
| audit_logs | Core | before_values | jsonb |  | Yes |  | Minimal safe prior values |
| audit_logs | Core | after_values | jsonb |  | Yes |  | Minimal safe resulting values |
| audit_logs | Core | reason | text |  | Yes |  | Decision or operation reason |
| audit_logs | Core | correlation_id | uuid |  | No |  | Request or operation correlation UUID |
| audit_logs | Core | created_at | timestamptz |  | No | now() | Audit time in business transaction |
| notification_outbox | P1 infrastructure | id | uuid | PK | No | gen_random_uuid() | Outbox UUID |
| notification_outbox | P1 infrastructure | event_key | text | UK | No |  | Stable unique domain event identity |
| notification_outbox | P1 infrastructure | recipient_id | uuid | FK | No |  | Recipient profile |
| notification_outbox | P1 infrastructure | event_type | text |  | No |  | Configured notification kind |
| notification_outbox | P1 infrastructure | payload | jsonb |  | No |  | Safe resource references; no tokens/documents |
| notification_outbox | P1 infrastructure | status | text |  | No | PENDING | PENDING PROCESSING DELIVERED FAILED |
| notification_outbox | P1 infrastructure | attempts | integer |  | No | 0 | Bounded retry count |
| notification_outbox | P1 infrastructure | next_attempt_at | timestamptz |  | Yes |  | Retry due time |
| notification_outbox | P1 infrastructure | locked_until | timestamptz |  | Yes |  | Worker claim lease; recover abandoned claims |
| notification_outbox | P1 infrastructure | delivered_at | timestamptz |  | Yes |  | Delivery handling completed |
| notification_outbox | P1 infrastructure | last_error | text |  | Yes |  | Redacted failure summary |
| notification_outbox | P1 infrastructure | created_at | timestamptz |  | No | now() | Record creation time in UTC |
| notification_outbox | P1 infrastructure | updated_at | timestamptz |  | No | now() | Last record update time in UTC |
| notifications | P1 infrastructure | id | uuid | PK | No | gen_random_uuid() | Inbox UUID |
| notifications | P1 infrastructure | recipient_id | uuid | FK | No |  | Only this user can read/mark read |
| notifications | P1 infrastructure | event_key | text |  | No |  | Unique with recipient_id |
| notifications | P1 infrastructure | title | text |  | No |  | Safe summary |
| notifications | P1 infrastructure | body | text |  | No |  | Safe message |
| notifications | P1 infrastructure | resource_type | text |  | No |  | Authorized application link kind |
| notifications | P1 infrastructure | resource_id | uuid |  | No |  | Target resource UUID; backend checks access |
| notifications | P1 infrastructure | read_at | timestamptz |  | Yes |  | First read time |
| notifications | P1 infrastructure | created_at | timestamptz |  | No | now() | Inbox creation time |
| property_reviews | P2 deferred | id | uuid | PK | No | gen_random_uuid() | Review UUID |
| property_reviews | P2 deferred | tenancy_id | uuid | FK,UK | No |  | One review per tenancy; property/tenant derived |
| property_reviews | P2 deferred | rating | integer |  | No |  | 1 to5 |
| property_reviews | P2 deferred | comment | text |  | No |  | Escaped plain text |
| property_reviews | P2 deferred | review_status | text |  | No | PENDING | PENDING APPROVED REJECTED |
| property_reviews | P2 deferred | reviewed_by | uuid | FK | Yes |  | Admin reviewer |
| property_reviews | P2 deferred | reviewed_at | timestamptz |  | Yes |  | Decision time |
| property_reviews | P2 deferred | review_reason | text |  | Yes |  | Required on rejection/removal |
| property_reviews | P2 deferred | revision | integer |  | No | 1 | Submitted content guard |
| property_reviews | P2 deferred | created_at | timestamptz |  | No | now() | Record creation time in UTC |
| property_reviews | P2 deferred | updated_at | timestamptz |  | No | now() | Last record update time in UTC |
| idempotency_records | Core | id | uuid | PK | No | gen_random_uuid() | Operation record UUID |
| idempotency_records | Core | actor_id | uuid | FK | No |  | Verified caller; replay must reauthorize current access |
| idempotency_records | Core | action | text |  | No |  | Allowlisted action name; unique with actor and operation UUID |
| idempotency_records | Core | client_operation_id | uuid |  | No |  | Client generated stable write retry UUID |
| idempotency_records | Core | request_hash | text |  | No |  | Server SHA256 of canonical original payload including parent UUID |
| idempotency_records | Core | result_resource_type | text |  | No |  | Result entity kind or bulk unit result |
| idempotency_records | Core | result_ids | uuid[] |  | No |  | One or more resulting UUIDs; no signed links or secret response bodies |
| idempotency_records | Core | response_status | integer |  | No |  | Original successful HTTP status |
| idempotency_records | Core | created_at | timestamptz |  | No | now() | Commit time; retention must respect supported retry window |
| favourite_properties | Core | id | uuid | PK | No | gen_random_uuid() | Favourite row identity |
| favourite_properties | Core | user_id | uuid | FK | No |  | Verified user_profiles.id; never supplied as actor by client |
| favourite_properties | Core | property_id | uuid | FK | No |  | Saved properties.id; independent of listing/unit |
| favourite_properties | Core | created_at | timestamptz |  | No | now() | Server save time for private pagination |

`favourite_properties` additionally has UNIQUE(user_id,property_id); this composite uniqueness is not a separate UUID identity. The current workbook itself remains version3; this package is the newer additive specification.
