# Test strategy and scenarios
## Levels
- Frontend unit/component tests for validation feedback, auth redirects, heart intent serialization, unavailable placeholders, stale-result discard and accessibility.
- Laravel unit tests for pure date/policy/catalog logic and integration tests for actual resource/action authorization, validation, transaction rollback and DTO privacy.
- PostgreSQL tests with two independent connections/barriers for GiST overlap, adjacent intervals, duplicate favourite/pending-request creation, confirmation versus correction/expiry and cron versus inventory changes. SQLite/sequential mocks cannot establish PostgreSQL exclusion behavior.
- End-to-end happy paths: property→units→draft→first approval→publication→enquiry→proposal→exact confirmation→move-in→renewal. Keep each operation separately tested.
- Storage/API provider success,401,403,timeout/retry/failure logging tests with deterministic fakes plus one controlled integration evidence run without exposing secrets.
- Course evidence measures frontend/business and API coverage separately with a defined denominator; both require **strictly more than70%** under the printed rubric. Do not change70 to>=70, claim unrun tests or inflate coverage by excluding core actions.

## Mandatory race outcomes
1. Same unit overlapping proposals: one commit; adjacent nonoverlapping periods: both may commit.
2. Pending renewal versus a future booking: one valid schedule; old confirmed span retained on failure.
3. v1 confirmation versus v2 correction: one legal pointer/version result; never mixed acknowledgements.
4. Confirmation at/after server deadline denied; stale expiry worker cannot expire a newer version.
5. Enquiry withdrawal/rejection versus proposal: no accepted request without tenancy or contradictory terminal result.
6. Due15day job with available alternative does not reject; inventory mutation shares property lock.
7. Favourite duplicate PUT: one pair; repeated DELETE204; add/remove late UI responses converge by serialized intent and refetch.
8. Initial approval versus linked-content edit409; owner publish cannot defeat admin suspension.

## Evidence
Record commands, environment/database version, test names, coverage reports and actual results in PR/CI. Until run, retain Not executed. Never place credentials or full private contracts in logs or fixture screenshots.
