# Actors and roles
| Actor | Allowed responsibility | Boundary |
|---|---|---|
| Guest | Public visible listing discovery | Cannot persist favourites, submit enquiries/reports or read private records |
| Authenticated user | Own profile and favourites | Actor derived from verified token; no user_id impersonation |
| Tenant | Own enquiries, related tenancy contracts, renewal requests | Cannot edit owner-submitted terms in place |
| Owner | Own properties/units/media/listings and related enquiries/proposals | Ownership relationship, not a global role selected at signup |
| Admin | First listing review, reports, suspension/restoration and audit inspection | is_admin is trusted server data; cannot acknowledge contracts on behalf of parties |
| System | Availability queries, expiration,15day evaluations, queued notification delivery | Uses same actions/invariants as HTTP routes |

A single normal profile may own and rent. Frontend route guards improve UX; Laravel Policies/guards enforce access on every resource and private download.
