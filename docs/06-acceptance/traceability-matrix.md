# FR traceability

Each FR has exactly one primary module; issues may reference several FRs without duplicating the implementation. Course rubric mapping is separate.

| FR | Feature | Product priority | Primary module | Case IDs |
| --- | --- | --- | --- | --- |
| FR01 | Email registration | P0 Must | M01-identity-access | FR01-AC01, FR01-AC02, FR01-AC03, FR01-AC04 |
| FR02 | Email login and session refresh | P0 Must | M01-identity-access | FR02-AC01, FR02-AC02, FR02-AC03, FR02-AC04 |
| FR03 | Google sign in | P2 Defer | M01-identity-access | FR03-AC01, FR03-AC02, FR03-AC03 |
| FR04 | Logout | P0 Must | M01-identity-access | FR04-AC01, FR04-AC02, FR04-AC03 |
| FR05 | Resource and admin authorization | P0 Must | M01-identity-access | FR05-AC01, FR05-AC02, FR05-AC03, FR05-AC04 |
| FR06 | Profile and dual dashboards | P0 Must | M01-identity-access | FR06-AC01, FR06-AC02, FR06-AC03 |
| FR07 | Create property draft without moderation | P0 Must | M02-property-units-media | FR07-AC01, FR07-AC02, FR07-AC03, FR07-AC04 |
| FR08 | Manage and archive own property | P0 Must | M02-property-units-media | FR08-AC01, FR08-AC02, FR08-AC03, FR08-AC04 |
| FR09 | Upload property and unit photos | P0 Must | M02-property-units-media | FR09-AC01, FR09-AC02, FR09-AC03, FR09-AC04 |
| FR10 | Create property-level listing draft | P0 Must | M03-listings-moderation | FR10-AC01, FR10-AC02, FR10-AC03, FR10-AC04 |
| FR11 | Edit listing without reapproval after initial approval | P0 Must | M03-listings-moderation | FR11-AC01, FR11-AC02, FR11-AC03, FR11-AC04 |
| FR12 | Submit initial listing package | P0 Must | M03-listings-moderation | FR12-AC01, FR12-AC02, FR12-AC03, FR12-AC04 |
| FR13 | Review initial listing packages | P0 Must | M03-listings-moderation | FR13-AC01, FR13-AC02, FR13-AC03 |
| FR14 | Approve initial listing package | P0 Must | M03-listings-moderation | FR14-AC01, FR14-AC02, FR14-AC03, FR14-AC04 |
| FR15 | Reject initial listing with reason | P0 Must | M03-listings-moderation | FR15-AC01, FR15-AC02, FR15-AC03 |
| FR16 | Dedicated changes requested state | P2 Defer | M03-listings-moderation | FR16-AC01 |
| FR17 | Publish initially approved listing | P0 Must | M03-listings-moderation | FR17-AC01, FR17-AC02, FR17-AC03, FR17-AC04 |
| FR18 | Hide or archive listing | P0 Must | M03-listings-moderation | FR18-AC01, FR18-AC02, FR18-AC03 |
| FR19 | Search listings by date-based availability | P0 Must | M04-discovery-favourites | FR19-AC01, FR19-AC02, FR19-AC03, FR19-AC04 |
| FR20 | Filter eligible units for the full requested interval | P0 Must | M04-discovery-favourites | FR20-AC01, FR20-AC02, FR20-AC03, FR20-AC04 |
| FR21 | Display listing details and eligible unit cards | P0 Must | M04-discovery-favourites | FR21-AC01, FR21-AC02, FR21-AC03, FR21-AC04 |
| FR22 | Interactive listing map | P2 Defer | M04-discovery-favourites | FR22-AC01, FR22-AC02 |
| FR23 | Synchronize map and filters | P2 Defer | M04-discovery-favourites | FR23-AC01, FR23-AC02 |
| FR24 | Geocode address | P2 Defer | M02-property-units-media | FR24-AC01, FR24-AC02, FR24-AC03 |
| FR25 | Submit rental request with contact details | P0 Must | M05-rental-requests | FR25-AC01, FR25-AC02, FR25-AC03, FR25-AC04, FR25-AC05 |
| FR26 | Prevent duplicate pending rental requests | P0 Must | M05-rental-requests | FR26-AC01, FR26-AC02, FR26-AC03 |
| FR27 | Tenant rental request dashboard | P0 Must | M05-rental-requests | FR27-AC01, FR27-AC02, FR27-AC03, FR27-AC04 |
| FR28 | Withdraw pending rental request | P0 Must | M05-rental-requests | FR28-AC01, FR28-AC02, FR28-AC03 |
| FR29 | Owner rental request inbox | P0 Must | M05-rental-requests | FR29-AC01, FR29-AC02, FR29-AC03, FR29-AC04 |
| FR30 | Accept request when tenancy proposal commits | P0 Must | M05-rental-requests | FR30-AC01, FR30-AC02, FR30-AC03, FR30-AC04 |
| FR31 | Reject pending rental request | P0 Must | M05-rental-requests | FR31-AC01, FR31-AC02, FR31-AC03 |
| FR32 | Audit request and tenancy outcomes | P0 Must | M05-rental-requests | FR32-AC01, FR32-AC02, FR32-AC03, FR32-AC04 |
| FR33 | Enforce nonoverlapping unit rental periods | P0 Must | M06-tenancies-contracts | FR33-AC01, FR33-AC02, FR33-AC03, FR33-AC04, FR33-AC05 |
| FR34 | Create tenancy proposal with temporary reservation | P0 Must | M06-tenancies-contracts | FR34-AC01, FR34-AC02, FR34-AC03, FR34-AC04, FR34-AC05 |
| FR35 | View tenancy timeline and contract versions | P0 Must | M06-tenancies-contracts | FR35-AC01, FR35-AC02, FR35-AC03, FR35-AC04 |
| FR36 | Submit tenancy based review | P2 Defer | M08-reports-admin | FR36-AC01, FR36-AC02, FR36-AC03 |
| FR37 | Display approved property reviews | P2 Defer | M08-reports-admin | FR37-AC01, FR37-AC02 |
| FR38 | Report public listing | P0 Must | M08-reports-admin | FR38-AC01, FR38-AC02, FR38-AC03, FR38-AC04, FR38-AC05 |
| FR39 | Investigate reports and suspend listings | P0 Must | M08-reports-admin | FR39-AC01, FR39-AC02, FR39-AC03, FR39-AC04 |
| FR40 | Public listing REST resources | P0 Must | M04-discovery-favourites | FR40-AC01, FR40-AC02, FR40-AC03 |
| FR41 | Property and unit REST CRUD | P0 Must | M02-property-units-media | FR41-AC01, FR41-AC02, FR41-AC03 |
| FR42 | Rental request tenancy and renewal action APIs | P0 Must | M06-tenancies-contracts | FR42-AC01, FR42-AC02, FR42-AC03, FR42-AC04 |
| FR43 | Verify Supabase JWT in Laravel | P0 Must | M01-identity-access | FR43-AC01, FR43-AC02, FR43-AC03, FR43-AC04, FR43-AC05 |
| FR44 | OpenAPI documentation | P1 Should | M10-operations-delivery | FR44-AC01, FR44-AC02, FR44-AC03 |
| FR45 | Asynchronous domain notifications | P1 Should | M09-notifications-audit | FR45-AC01, FR45-AC02, FR45-AC03, FR45-AC04 |
| FR46 | Cache public listing content with fresh visibility checks | P1 Should | M04-discovery-favourites | FR46-AC01, FR46-AC02, FR46-AC03 |
| FR47 | Structured logs and critical alerts | P1 Should | M10-operations-delivery | FR47-AC01, FR47-AC02, FR47-AC03 |
| FR48 | Development monitoring and slow query alerts | P1 Should | M10-operations-delivery | FR48-AC01, FR48-AC02, FR48-AC03 |
| FR49 | Password reset and email confirmation | P0 Must | M01-identity-access | FR49-AC01, FR49-AC02, FR49-AC03 |
| FR50 | Create and bulk create units | P0 Must | M02-property-units-media | FR50-AC01, FR50-AC02, FR50-AC03, FR50-AC04 |
| FR51 | Edit unit details and advertised terms | P0 Must | M02-property-units-media | FR51-AC01, FR51-AC02, FR51-AC03, FR51-AC04 |
| FR52 | Manage operational status independently of availability | P0 Must | M02-property-units-media | FR52-AC01, FR52-AC02, FR52-AC03, FR52-AC04 |
| FR55 | Audit property unit and policy updates | P0 Must | M02-property-units-media | FR55-AC01, FR55-AC02, FR55-AC03, FR55-AC04 |
| FR56 | Select reorder and remove gallery images | P0 Must | M02-property-units-media | FR56-AC01, FR56-AC02, FR56-AC03, FR56-AC04 |
| FR57 | Update photos without a replacement-review workflow | P0 Must | M02-property-units-media | FR57-AC01, FR57-AC02, FR57-AC03, FR57-AC04 |
| FR59 | Safely clean orphaned and deleted media | P1 Should | M02-property-units-media | FR59-AC01, FR59-AC02, FR59-AC03, FR59-AC04 |
| FR60 | Manage controlled property JSONB policies | P0 Must | M02-property-units-media | FR60-AC01, FR60-AC02, FR60-AC03, FR60-AC04 |
| FR61 | Resolve unit policy overrides and additional rules | P0 Must | M02-property-units-media | FR61-AC01, FR61-AC02, FR61-AC03, FR61-AC04 |
| FR66 | Cancel proposals and end confirmed tenancies | P0 Must | M06-tenancies-contracts | FR66-AC01, FR66-AC02, FR66-AC03, FR66-AC04, FR66-AC05 |
| FR67 | Record original immutable agreement version | P0 Must | M06-tenancies-contracts | FR67-AC01, FR67-AC02, FR67-AC03, FR67-AC04 |
| FR68 | Submit one pending renewal request | P0 Must | M07-renewals | FR68-AC01, FR68-AC02, FR68-AC03, FR68-AC04 |
| FR69 | Withdraw or reject pending renewal request | P0 Must | M07-renewals | FR69-AC01, FR69-AC02, FR69-AC03, FR69-AC04 |
| FR70 | Propose renewal as new immutable version | P0 Must | M07-renewals | FR70-AC01, FR70-AC02, FR70-AC03, FR70-AC04, FR70-AC05, FR70-AC06 |
| FR71 | Keep immutable versions and effective agreement history | P0 Must | M06-tenancies-contracts | FR71-AC01, FR71-AC02, FR71-AC03, FR71-AC04 |
| FR72 | Reporter outcome and rate limits | P0 Must | M08-reports-admin | FR72-AC01, FR72-AC02, FR72-AC03, FR72-AC04 |
| FR73 | Private notification inbox | P1 Should | M09-notifications-audit | FR73-AC01, FR73-AC02, FR73-AC03 |
| FR74 | Idempotent writes and stale revisions | P0 Must | M06-tenancies-contracts | FR74-AC01, FR74-AC02, FR74-AC03, FR74-AC04 |
| FR75 | Transactional locking audit and consistency | P0 Must | M06-tenancies-contracts | FR75-AC01, FR75-AC02, FR75-AC03, FR75-AC04 |
| FR76 | Deferred and excluded MVP scope | P3 Exclude | M10-operations-delivery | FR76-AC01, FR76-AC02, FR76-AC03 |
| FR77 | Calculate availability counts and rent ranges | P0 Must | M04-discovery-favourites | FR77-AC01, FR77-AC02, FR77-AC03, FR77-AC04 |
| FR78 | Suspend and restore listings after reports or inspection | P0 Must | M03-listings-moderation | FR78-AC01, FR78-AC02, FR78-AC03, FR78-AC04, FR78-AC05 |
| FR79 | Moderate optional property reviews | P2 Defer | M08-reports-admin | FR79-AC01, FR79-AC02, FR79-AC03 |
| FR80 | Confirm move-in after mutual contract confirmation | P0 Must | M06-tenancies-contracts | FR80-AC01, FR80-AC02, FR80-AC03, FR80-AC04 |
| FR81 | Confirm the exact contract version mutually | P0 Must | M06-tenancies-contracts | FR81-AC01, FR81-AC02, FR81-AC03, FR81-AC04, FR81-AC05, FR81-AC06 |
| FR82 | Decline and correct unconfirmed versions | P0 Must | M06-tenancies-contracts | FR82-AC01, FR82-AC02, FR82-AC03, FR82-AC04, FR82-AC05 |
| FR83 | Expire temporary confirmation reservations | P0 Must | M06-tenancies-contracts | FR83-AC01, FR83-AC02, FR83-AC03, FR83-AC04, FR83-AC05 |
| FR84 | Reserve renewal extension without releasing current occupancy | P0 Must | M06-tenancies-contracts | FR84-AC01, FR84-AC02, FR84-AC03, FR84-AC04 |
| FR85 | Apply 15-day rejection using actual availability | P0 Must | M05-rental-requests | FR85-AC01, FR85-AC02, FR85-AC03, FR85-AC04, FR85-AC05, FR85-AC06, FR85-AC07, FR85-AC08 |
| FR86 | Enforce immutable contract terms and write-once confirmations | P0 Must | M06-tenancies-contracts | FR86-AC01, FR86-AC02, FR86-AC03, FR86-AC04, FR86-AC05 |
| FR87 | Manage consistent standard and custom amenities | P0 Must | M02-property-units-media | FR87-AC01, FR87-AC02, FR87-AC03, FR87-AC04, FR87-AC05, FR87-AC06, FR87-AC07, FR87-AC08, FR87-AC09, FR87-AC10 |
| FR88 | Save and manage favourite properties | P0 Must | M04-discovery-favourites | FR88-AC01, FR88-AC02, FR88-AC03, FR88-AC04, FR88-AC05, FR88-AC06, FR88-AC07, FR88-AC08, FR88-AC09, FR88-AC10 |
