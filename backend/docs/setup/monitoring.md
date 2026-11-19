# Monitoring and alerts (RNT-12)

## Split of responsibility

| Concern | Owner |
| --- | --- |
| Critical application failures (500 / exhausted jobs) | Laravel `OpsAlerter` → Discord only (queued) |
| Individual slow SQL (≥1000 ms) | Log every hit; Discord after 3 same fingerprint / 5 min |
| Critical slow SQL (≥5000 ms) | Discord immediate + admin email |
| Cumulative request DB time (≥2000 ms) | Log with QueryStats; Discord + email after 5 same-route breaches / 10 min |
| CPU / memory / disk / network charts and host thresholds | Netdata on the VPS |
| Local query investigation | Telescope (`TELESCOPE_ENABLED=true` locally only) |

Alert keys use a **10 minute** cooldown after Discord/email fires. Counters and cooldowns go through Laravel `Cache`. Cross-worker dedupe is only as strong as your `CACHE_STORE` (file is fine for a single app container; use redis/database if you need shared state across processes).

## Application configuration

Set in the API environment (see `backend/.env.example` and `compose.production.yml`):

- `MONITORING_SLOW_QUERIES=true`
- `SLOW_QUERY_MS=1000`
- `SLOW_QUERY_CRITICAL_MS=5000`
- `SLOW_QUERY_DISCORD_COUNT=3` / `SLOW_QUERY_DISCORD_WINDOW_SECONDS=300`
- `SLOW_REQUEST_DB_MS=2000`
- `DB_TIME_DISCORD_COUNT=5` / `DB_TIME_DISCORD_WINDOW_SECONDS=600`
- `OPS_ALERT_EMAIL` backup admin address when the database is down (DB-critical mail only)
- `DISCORD_ALERT_WEBHOOK`
- `OPS_ALERT_DEDUPE_SECONDS=600`

API 5xx responses return `{ message, error_code, reference }` with `X-Request-Id`. Public codes are `storage_failed`, `service_unavailable`, and `server_error`.

## Netdata

See [infrastructure/netdata/README.md](../../../infrastructure/netdata/README.md).

Visibility limits:

- Netdata measures the VPS. It does not measure Supabase database disk or the storage bucket.
- Dokploy container graphs show one container against shared host RAM. They are not a private 2 GB allocation and are not the host alert implementation.
- Dokploy server CPU/memory threshold fields are documented for Dokploy Cloud. This project uses self-hosted Dokploy and Netdata instead.
- A running `worker` container whose command is `queue:work` only proves the process started. It does not prove jobs are completing.

## Recovery notes

- Slow-query / high DB-time email: open the reference in local Telescope or the production log; check top SQL patterns for N+1 or missing indexes.
- Netdata memory alert: see which container grew in Dokploy. Restarting can hide a leak and can worsen a traffic spike. Do not run `docker system prune --volumes`.
- Discord delivery failure: look for `ops.alert.fallback` after `SendOpsDiscordAlert` retries are exhausted.

## Evidence checklist

- PHPUnit monitoring tests
- Frontend error-code / error-boundary tests
- App critical → Discord, no email
- Critical slow query (≥5000 ms) → Discord + email
- Cumulative 5th breach → Discord + email with query summary
- API error screen whose `error_code` and reference match the log
- Netdata charts (CPU, memory, disk, network) and one restored threshold notification
