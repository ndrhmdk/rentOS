# Error/performance monitoring and alerts

Khai installs/configures Telescope in RNT-01: provider/assets/migrations/private-schema storage, request/exception/query/job watchers, filtering, access restrictions and scheduled telescope:prune retention. Demonstrate controlled local records without secrets. Do not expose a deployed APP_ENV=local dashboard.

Tri’s RNT-12 adds request/job correlation, safe user-facing error references, critical-error reports, deduplicated individual slow-query alerts and CPU/memory/disk/network monitoring for the actual app/worker host. A query shown in Telescope is not an alert delivered to an operator. State provider visibility limits rather than inventing managed-database metrics. Failed alert delivery must not recurse or corrupt business outcomes; preserve redacted fallback logs.

Test watcher/config/access/redaction/pruning at setup; test threshold/dedup/delivery failures and actual controlled alert receipt in RNT-12. No application measurements or alerts are claimed executed in this pack.


Official Telescope configuration/pruning/access reference: https://laravel.com/docs/12.x/telescope. Choose the matching installed framework version; these docs do not prove a package has been installed.


Official Telescope configuration/pruning/access reference: https://laravel.com/docs/12.x/telescope. Choose the matching installed framework version; these docs do not prove a package has been installed.

## Production alert delivery (RNT-12)

`compose.production.yml` passes these variables to the `api` and `worker` services. If they are left empty, the app keeps running and writes `ops.alert` to the logs, but no alert reaches an operator.

| Variable | Needed for | Notes |
| --- | --- | --- |
| `DISCORD_ALERT_WEBHOOK` | Discord alerts | Without it, Discord delivery is skipped. Used for `critical` (API 5xx, exhausted jobs), `slow_query`, `slow_query_critical` and `db_time`. |
| `MAIL_*` (mailer settings) | Email alerts | Email is sent only for `slow_query_critical` and `db_time`, synchronously from the request or job that triggered it. |
| `OPS_ALERT_EMAIL` | Email fallback | Email goes to every user with `is_admin = true`. If there are no admins, or the lookup fails, this address is used instead. If neither exists, `ops.alert.no_recipients` is logged. |
| `MONITORING_SLOW_QUERIES` | Slow-query and DB-time alerts | Defaults to `false` in the app and `.env.example`, and to `true` in `compose.production.yml`. |
| `OPS_ALERT_DEDUPE_SECONDS` | Dedupe window | Repeats of the same alert within this window are logged as `ops.alert.deduped` and not delivered again. |

**Queue worker.** The `SendOpsDiscordAlert` job queues each Discord alert on the default queue of `QUEUE_CONNECTION` (`database` by default). The `worker` service (`php artisan queue:work`) delivers it, with 3 tries and 10/30/60s backoff. If every try fails, `ops.alert.fallback` (`reason=discord_delivery_failed`) is logged.

**When the queue is unavailable.** If dispatching the job throws (for example, because the database queue is down), the app posts to Discord directly with a 5s timeout. If that also fails, it logs `ops.alert.fallback` (`reason=discord_enqueue_and_sync_failed`). If the queue accepts the job but the `worker` container is stopped, the alert waits in the `jobs` table and is sent only after the worker comes back. Netdata host monitoring (`infrastructure/netdata/README.md`) is what notices a host that is down.

**Dedupe cache.** Dedupe keys and slow-query counters live in `CACHE_STORE`. In production it defaults to `file` on the shared `laravel_storage` volume, so `api` and `worker` share one dedupe state on this single host. If the stack is spread across several hosts, switch to `redis` or `database`. If the cache store throws, the alert is still sent (possibly more than once), `ops.alert.fallback` (`channel=cache`) is logged, and the API keeps returning its safe `error_code` and `reference` response.

**Verifying delivery.** After deploying, run this inside the `api` container:

```sh
php artisan tinker --execute 'app(App\Monitoring\OpsAlerter::class)->report("slow_query_critical", "OPS_TEST", "Manual alert test", ["fingerprint" => "ops-test-".now()->timestamp]);'
```

This kind triggers both a Discord message and an email. Confirm that both arrive, and that `ops.alert` with `error_code=OPS_TEST` shows up in the logs. The timestamp fingerprint avoids the dedupe window, so you can run it again.
