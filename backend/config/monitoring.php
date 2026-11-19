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
    */

    'slow_queries' => (bool) env('MONITORING_SLOW_QUERIES', true),

    'slow_query_ms' => (float) env('SLOW_QUERY_MS', 500),

    'slow_request_db_ms' => (float) env('SLOW_REQUEST_DB_MS', 2000),

    /*
    |--------------------------------------------------------------------------
    | Ops alert delivery
    |--------------------------------------------------------------------------
    */

    'ops_alert_email' => env('OPS_ALERT_EMAIL'),

    'discord_webhook' => env('DISCORD_ALERT_WEBHOOK'),

    'dedupe_seconds' => (int) env('OPS_ALERT_DEDUPE_SECONDS', 900),

    'admin_cache_seconds' => (int) env('OPS_ADMIN_CACHE_SECONDS', 300),

];
