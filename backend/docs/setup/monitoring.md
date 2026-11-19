# Monitoring and alerts (RNT-12)

## Split of responsibility

| Concern | Owner |
| --- | --- |
| Critical application failures | Laravel `OpsAlerter` email to `is_admin`, Discord for critical only |
| Individual slow SQL | Laravel `DB::listen` + `OpsAlerter` |
| Cumulative request DB time | Laravel `DB::whenQueryingForLongerThan` warning log |
| CPU / memory / disk / network charts and host thresholds | Netdata on the VPS |
| Local query investigation | Telescope (`TELESCOPE_ENABLED=true` locally only) |

## Application configuration

Set in the API environment (see `backend/.env.example` and `compose.production.yml`):

- `MONITORING_SLOW_QUERIES=true`
- `SLOW_QUERY_MS=500`
- `SLOW_REQUEST_DB_MS=2000`
- `OPS_ALERT_EMAIL` backup admin address when the database is down
- `DISCORD_ALERT_WEBHOOK` for critical failures only
- `OPS_ALERT_DEDUPE_SECONDS=900`

API 5xx responses return `{ message, error_code, reference }` with `X-Request-Id`. Public codes are `storage_failed`, `service_unavailable`, and `server_error`.

## Netdata

See [infrastructure/netdata/README.md](../../../infrastructure/netdata/README.md).

Visibility limits:

- Netdata measures the VPS. It does not measure Supabase database disk or the storage bucket.
- Dokploy container graphs show one container against shared host RAM. They are not a private 2 GB allocation and are not the host alert implementation.
- Dokploy server CPU/memory threshold fields are documented for Dokploy Cloud. This project uses self-hosted Dokploy and Netdata instead.
- A running `worker` container whose command is `queue:work` only proves the process started. It does not prove jobs are completing.

## Frontend on Vercel

The production frontend is hosted on Vercel. `compose.production.yml` runs `migrate`, `api`, and `worker` only.

Vercel project settings:

- Framework: Next.js
- Root Directory: `frontend`
- Build Command: `next build`
- Environment: `NEXT_PUBLIC_API_URL=https://api.rentos.io.vn`

Design tokens live inside `frontend/src/app/globals.css` so the build does not need files outside `frontend/`.

Keep `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, and `SANCTUM_STATEFUL_DOMAINS` aligned with `https://rentos.io.vn`. Add a temporary `*.vercel.app` origin to those values while testing a preview URL.

## Recovery notes

- Slow-query email: open the reference in local Telescope or the production log and fix the statement (index or N+1).
- Netdata memory alert: see which container grew in Dokploy. Restarting can hide a leak and can worsen a traffic spike. Do not run `docker system prune --volumes`.
- Application mail failure: look for `ops.alert.fallback`. The user action that already committed stays committed.

## Evidence checklist

- PHPUnit monitoring tests
- Frontend error-code / error-boundary tests
- One critical admin email + Discord message
- One slow-query email without Discord
- API error screen whose `error_code` and reference match the log/email
- Netdata charts (CPU, memory, disk, network) and one restored threshold notification
