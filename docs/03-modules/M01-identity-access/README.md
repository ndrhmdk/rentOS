# M01 Identity and access
 Primary owner: Member-A. Required reviewer: Member-C. This is a proposed allocation, not verified GitHub assignment.

 Supabase identity, profile bootstrap, dual tenant/owner navigation and server resource authorization.

 Read [PRD](prd.md), [business rules](../../02-domain/business-rules.md), [state transitions](../../02-domain/state-transition.md), [API contract](../../07-architecture/api-design.md) and [course compliance](../../08-project/course-compliance.md). The local AI must inspect existing implementation before creating missing-work issues.

 Critical review focus: JWT verification, account/session isolation and admin privilege boundaries.

 Explicit boundaries: No second password store; Google OAuth is deferred; Sanctum rubric substitution is unresolved.
