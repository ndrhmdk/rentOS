# M09 Notifications and audit delivery
 Primary owner: Member-B. Required reviewer: Member-A. This is a proposed allocation, not verified GitHub assignment.

 Transactional outbox, private in-app inbox where supported, event deduplication and after-commit worker delivery.

 Read [PRD](prd.md), [business rules](../../02-domain/business-rules.md), [state transitions](../../02-domain/state-transition.md), [API contract](../../07-architecture/api-design.md) and [course compliance](../../08-project/course-compliance.md). The local AI must inspect existing implementation before creating missing-work issues.

 Critical review focus: No rolled-back success notice, private links, retry leases and worker duplicate safety.

 Explicit boundaries: No viewing reminders; logs/outbox remain distinct from notifications; real email transport optional unless chosen for external-API evidence.
