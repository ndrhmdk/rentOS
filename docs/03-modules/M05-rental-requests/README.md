# M05 Rental requests and offline contact
 Primary owner: Member-C. Required reviewer: Member-A. This is a proposed allocation, not verified GitHub assignment.

 Contact snapshots, pending enquiries, owner phone discussion, rejection/withdrawal and age15day availability outcome.

 Read [PRD](prd.md), [business rules](../../02-domain/business-rules.md), [state transitions](../../02-domain/state-transition.md), [API contract](../../07-architecture/api-design.md) and [course compliance](../../08-project/course-compliance.md). The local AI must inspect existing implementation before creating missing-work issues.

 Critical review focus: Request acceptance atomic with tenancy proposal; one pending thread; cron versus withdrawal/create races.

 Explicit boundaries: No calendar, chat or separate manual Accept. Another acceptance does not immediately reject other prospects.
