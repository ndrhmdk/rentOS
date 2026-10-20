# Deployment and operations

Discover chosen provider first; document web frontend, Laravel API, persistent PostgreSQL/storage, long-running workers and scheduler as separate responsibilities even if deployed together. Use environment templates, HTTPS, allowed origins/redirects, restricted diagnostics, signed private downloads, safe migrations/seeds, queue restart and health checks. Record runbook for worker/scheduler outage, failed jobs, migrations and visibility/cache invalidation. Do not claim deployment/free tiers or production readiness without evidence.

Validation is part of feature/engineering issues and PR evidence. Tool versions/configuration must match the local installed framework; no invented pass result.
