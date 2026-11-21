<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Slow query monitoring
    |--------------------------------------------------------------------------
    |
    | When enabled, individual SQL statements and cumulative request DB time
    | are watched. Keep this false in PHPUnit so the suite does not alert on
    | every test query.
    |
    | Counters and alert cooldowns require a shared cache store (Redis or
    | database) across PHP processes in production.
    |
    */

    'slow_queries' => (bool) env('MONITORING_SLOW_QUERIES', false),

    'slow_query_ms' => (float) env('SLOW_QUERY_MS', 1000),

    'slow_query_critical_ms' => (float) env('SLOW_QUERY_CRITICAL_MS', 5000),

    'slow_query_discord_count' => (int) env('SLOW_QUERY_DISCORD_COUNT', 3),

    'slow_query_discord_window_seconds' => (int) env('SLOW_QUERY_DISCORD_WINDOW_SECONDS', 300),

    'slow_request_db_ms' => (float) env('SLOW_REQUEST_DB_MS', 2000),

    'db_time_discord_count' => (int) env('DB_TIME_DISCORD_COUNT', 5),

    'db_time_discord_window_seconds' => (int) env('DB_TIME_DISCORD_WINDOW_SECONDS', 600),

    /*
    |--------------------------------------------------------------------------
    | Ops alert delivery
    |--------------------------------------------------------------------------
    */

    'ops_alert_email' => env('OPS_ALERT_EMAIL'),

    'discord_webhook' => env('DISCORD_ALERT_WEBHOOK'),

    'dedupe_seconds' => (int) env('OPS_ALERT_DEDUPE_SECONDS', 600),

    'admin_cache_seconds' => (int) env('OPS_ADMIN_CACHE_SECONDS', 300),

];
