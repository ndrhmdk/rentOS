# Open implementation decisions

These questions do not reopen agreed features or block unrelated work:

- Exact installed Laravel/Next.js/package versions, repository paths and existing implementation state.
- Final hosting provider, direct-DB connectivity/network support and deployment environments/approval configuration.
- Cache keys/TTL, unused-file retention, alert thresholds/channel, performance dataset/budget and backup RPO/RTO.
- Secure client token handling and per-client-session rotation binding; token expiry remains finite and within verified identity expiry.
- Whether any non-local Telescope dashboard will be enabled; otherwise keep it disabled and demonstrate local diagnostics. Browser navigation is not automatically authenticated by frontend bearer headers.
- Record documentary scope of teacher approval for the Next.js substitution for printed Blade/Livewire wording and the actual CSRF demonstration. Sanctum, Scramble and Telescope are required and are not open waiver questions.
- Actual GitHub handles for Khai, Kien, Hien and Tri; existing source/features/tests and real submission/demo/report URLs.

Do not invent completed decisions, free hosting, test passes, alerts or a repository audit. Inspect first, then record the chosen bounded implementation in its ADR/PR.
