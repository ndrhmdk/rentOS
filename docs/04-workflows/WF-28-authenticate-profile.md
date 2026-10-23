# WF-28 Register, sign in, obtain API access and manage profile

Actors: Guest; authenticated user; Supabase; Laravel.

Requirements: FR01 FR02 FR04 FR05 FR06 FR43 FR49

## Preconditions and trigger

Configured Supabase project and RNT-01 Sanctum infrastructure. User registers, signs in, refreshes, recovers access or signs out.

## Main flow

1. Register/confirm email/sign in or recover password through Supabase; no second Laravel password store.
2. Send provider access JWT to the rate-limited Laravel identity-to-token endpoint. Verify signature, allowed algorithm, project issuer/audience, expiry, subject and account eligibility.
3. Resolve one UUID profile; issue a finite Sanctum token with server-approved abilities and expiry no later than the verified identity token. Store only its hash.
4. Use the Sanctum bearer token on private product APIs. Run `auth:sanctum`, required ability and current resource Policy. Public listing GET routes remain public.
5. On eligible provider refresh, rotate this client session’s Laravel token and revoke the previous token. Account/role data is server-controlled.
6. Successful logout revokes the Laravel token, signs out of the provider and clears private client state. Handle offline revocation failure honestly and bound remaining validity by expiry.
7. After confirmed password recovery, authenticated server handling revokes the profile’s previous API tokens; fresh sign-in restores access.

## Alternatives and failure flows

Invalid/expired/revoked tokens return 401; missing ability or forbidden resource returns 403 (or documented non-disclosing 404). Reject forged admin scopes/actor IDs. Bounded trusted-JWKS refresh fails closed; never follow token-supplied key URLs. A provider JWT alone is not a private product API credential.

## Postcondition

One provider identity/profile; private API access exists only while a suitable Sanctum token and current Policy permit it. Tests exercise actual issued bearer tokens, not only helpers.


## Delivery and evidence

See the [traceability matrix](../06-acceptance/traceability-matrix.md) for responsible issues and all acceptance specifications. Private write actions use Sanctum abilities plus Policies; apply audit/idempotency/locking only where the domain action requires them. Manual screen checks complement unit/component/API integration tests; no required E2E suite.
