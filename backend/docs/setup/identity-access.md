# Identity integration for Tenant, Owner and Admin feature owners

Laravel 13 / Fortify headless / Sanctum. One `users` UUID is the account and contact profile. Users can both rent and own. There is no client-selected Tenant/Owner role and no browser PAT login. `users.is_admin` and `account_status` are server-managed.

## Browser contract

Use the same host style (`localhost` on both apps). Configure `FRONTEND_URL`, exact `FRONTEND_ORIGINS`, `SANCTUM_STATEFUL_DOMAINS`, database sessions and mail transport. Default local URLs are frontend localhost:3000, API localhost:8000. Do not use log mail transport for reset/verification secrets; use a private SMTP capture inbox locally and an appropriate transport in deployment.

1. GET `/sanctum/csrf-cookie` with credentials included.
2. POST Fortify `/register` or `/login` with session cookies and the URL-decoded XSRF-TOKEN cookie in `X-XSRF-TOKEN`. Login creates no PAT; remember-me is disabled.
3. GET `/api/v1/me` returns `data: {id,name,email,phone,email_verified,is_admin}` only.
4. PATCH `/api/v1/profile`: `{name,phone}`. Session-only, active, verified, CSRF, UserPolicy. Privilege/identity/email/password inputs are prohibited.
5. POST `/logout` invalidates the current session, not independently issued PATs.

Other Fortify routes: POST `/forgot-password`, POST `/reset-password` (`email,token,password,password_confirmation`), GET signed `/email/verify/{id}/{hash}`, POST `/email/verification-notification`, POST `/user/confirm-password`, GET `/user/confirmed-password-status`, PUT `/user/password` (`current_password,password,password_confirmation`). Password rules: at least 12 characters with upper/lowercase letters and numbers. Password reset/change revokes all sessions, PATs and outstanding reset links, rotates remember credentials and requires fresh login.

Unverified browser sessions can read minimal `/me`, verify/resend verification and logout; account credential recovery remains available. Other product API routes require verification. Errors use JSON when Accept is application/json: 401 unauthenticated; 403 account/permission/mode denial; 404 absent or foreign token; 409 stale data where implemented; 419 CSRF; 422 field validation; 423 recent password confirmation required; 429 rate limit. Browser CSRF can fail before auth, so an expired write may return 419.

## Private APIs are protected by default

`bootstrap/app.php` adds `auth:sanctum`, `AccountAccess`, `CredentialMode` to the `api` group. Thus new routes in `routes/api.php` require active/verified account and a browser session unless explicitly approved for PAT. `GET /api/v1/me` is the minimal unverified-session exception. Public health lives in web routes; public discovery endpoints require a deliberate public route design and safe Resources.

Add `account.admin` to admin route groups. This requires a web session and the current `access-admin` Gate. Do not add a global admin Policy bypass. Each feature must authorize its actual resource via a Laravel Policy. An owner is the current user matching the property's owner_id; a tenant/participant matches the rental record. Never accept owner/actor IDs from the client as proof of permission. Do not use `tokenCan` to determine ownership or admin access.

`session.only` is available for explicitly session-only groups; `password.recent` requires explicit confirmation within 15 minutes. Existing API default credential checks already reject PAT on non-allowlisted routes. Features outside the API group must explicitly apply their auth/account/session/CSRF controls.

## PAT matrix and settings

| Endpoint | PAT ability | Status |
| --- | --- | --- |
| GET `/api/v1/me` | account:read | Implemented |
| GET `/api/v1/favourite-properties` | favourites:read | Allowlist contract only; M04 owns route/Policy |
| PUT/DELETE `/api/v1/favourite-properties/{property}` | favourites:write | Allowlist contract only; M04 owns route/Policy |
| Every other private API | PAT denied with 403 | Default credential mode |

PAT requests must be cookie-free and carry no browser Origin/Referer/Sec-Fetch context. Mixed browser/PAT requests are rejected rather than falling back around CSRF. Ability grants are additional to current account and resource Policies. Expired/revoked/unknown tokens are 401 before protected data; pruning is independent of request enforcement.

Settings routes:

- GET `/api/v1/account/api-tokens?page=1`: own metadata, 25 per page, no secrets/hashes.
- POST same path: `{name,abilities,expiry_days}`; name 1–100, at least one approved ability, expiry 1/7/30 days (default 30). Session-only + verified/active + CSRF + recent password + throttle. Returns 201 `{data: metadata, plain_text_token: ...}` with no-store.
- DELETE `/api/v1/account/api-tokens/{id}`: same mutation guards, own row only; 204 success, foreign/absent 404.

All identity responses, including errors, use no-store. The creation secret must not enter audit, replay storage, logs, localStorage or Query/Mutation caches. A lost creation response requires metadata refresh, explicit revoke and explicit new creation; no automatic replay. Cookie-free example (supply TOKEN locally, never commit its value):

```bash
curl --fail-with-body -H 'Accept: application/json' \
  -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/me
```

The real favourites demo remains dependent on M04. Test-only routes in IdentitySecurityTest verify shared guards, not completed domain behavior.

## Suspension and revocation integration

`RevokeCredentials` locks the user, updates credentials/status, increments credential_version, deletes all sessions/PATs/reset links and inserts security audit transactionally. A session captures credential_version at login; mismatch prevents an in-flight request from resurrecting an old credential after revocation. Token/profile writes recheck account/version under the user lock.

Admin feature owners should call `SuspendAccount::handle($actor,$target)` inside the approved moderation transaction. It checks the current admin Gate and invokes revocation with SUSPENDED status. No suspension HTTP endpoint is exposed by RNT-03. Restoration must not recreate deleted tokens/sessions. Session storage must remain on the same PostgreSQL database/transaction boundary as users; a separately configured session database requires a new revocation design.

Q&A-02 (Khai): confirm domain lock ordering, reason fields, actor/correlation and ownership of detailed moderation audit before wiring the final admin endpoint. Already-authorized in-flight requests are not promised to be cancelled; sensitive domain actions recheck current account/Policy inside their transactions.

## Explicit pending decisions

- Q&A-01: `profile_revision` / expected_revision / stale 409 is intentionally commented out pending Khai. Current profile PATCH does not implement FR06-AC03. The proposal is next to profile mutation and the additive credential-version migration; do not silently mark concurrency acceptance complete.
- Q&A-02: real favourites/admin domain endpoints and resource Policies are feature-owner work. The shared auth layer is enabled; domain route examples remain commented out.
- Q&A-03: security audit currently uses users UUID as entity_id and PAT bigint token_id as safe metadata. Confirm convention with Khai without turning off mandatory audit or widening permissions.

## Diagnostics and operations

Telescope requires a current admin session even locally and is disabled by default in the test environment. Only request metadata for `/api/health` and `/up` is recorded; credential-bearing routes and risky query/mail/model/event/log/exception watchers are not stored. Q&A-02: reintroduce useful broader diagnostics only after safe redaction is reviewed. Next.js development request logging excludes `/reset-password` URLs; deployment ingress/access logs must also omit query strings and sensitive referrers. The reset screen sends a no-referrer policy. Standard configured log channels redact credential keys/token patterns and serialize exception type/code rather than raw arguments. Never log an entire auth request/response or use mail=log for account links.

Run the scheduler in deployment; `sanctum:prune-expired --hours=24` runs daily. Deployed frontend/API should be sibling HTTPS domains with exact credentialed CORS, correct stateful hosts and parent-domain Secure/HttpOnly/Lax session cookie. Simulated HTTP tests verify cookie configuration; actual DNS/HTTPS/browser and Supabase grants/private Storage still need staging validation.

## Validation

`php artisan test --compact` uses isolated PostgreSQL `rentos_test` only; test bootstrap refuses hosted/shared database targets. For the local Docker test instance used during development: `DB_PORT=55432 php artisan test --compact`. Concurrency tests run separate PHP processes and rebuild only that isolated database. Tests explicitly disable the testing CSRF bypass and use real cookies/database sessions and real PATs.

Run `vendor/bin/pint --dirty --format agent` after PHP changes. Scramble documents session+CSRF separately from bearer; use `php artisan scramble:export --path=/tmp/rentos-openapi.json` to inspect locally. Frontend types are explicit; TypeScript generation stays deferred.
