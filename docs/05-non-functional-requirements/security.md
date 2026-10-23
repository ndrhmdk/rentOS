# Security

Supabase is the identity/password provider; private Laravel product APIs use real Sanctum token authentication, abilities and resource Policies. Verify provider JWT only at issuance. Store token hashes, set finite expiry, rotate per-client sessions and revoke on successful logout/recovery. Never derive admin privilege or actor identity from request bodies; restrict own/participant/admin resources and private object downloads.

Sanctum bearer use is a deliberate course design; installing Sanctum alone does not validate provider JWTs. Laravel recommends session-cookie SPA authentication ordinarily; cookie-based paths, if implemented, need their own CSRF and credentialed CORS protections. Do not claim an unrelated-domain cookie setup works automatically. Keep tokens out of URLs/logs/shared caches; redaction includes diagnostic payloads/query bindings.

Telescope is local by default. Non-local access remains disabled unless a tested restricted access path exists; a normal browser navigation does not automatically attach an SPA bearer token. Keep application/token/audit tables outside unintended Data API grants, private buckets private and service/database credentials server-only. Direct Eloquent SQL does not automatically enforce Supabase auth.uid()-based RLS; Laravel Policies and restricted DB roles are required.
