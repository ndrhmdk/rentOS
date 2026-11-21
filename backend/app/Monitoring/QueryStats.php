<?php

namespace App\Monitoring;

use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Str;

final class QueryStats
{
    public const MAX_PATTERNS = 50;

    public int $count = 0;

    /** @var array<string, array{sql: string, count: int, total_ms: float, max_ms: float}> */
    public array $patterns = [];

    public function record(QueryExecuted $query): void
    {
        $this->count++;

        $normalizedSql = $this->normalizeSql($query->sql);
        $fingerprint = hash(
            'sha256',
            (string) $query->connectionName.':'.$normalizedSql
        );

        if (! isset($this->patterns[$fingerprint])) {
            if (count($this->patterns) >= self::MAX_PATTERNS) {
                return;
            }

            $this->patterns[$fingerprint] = [
                'sql' => Str::limit($normalizedSql, 500, ''),
                'count' => 0,
                'total_ms' => 0.0,
                'max_ms' => 0.0,
            ];
        }

        $stats = &$this->patterns[$fingerprint];
        $stats['count']++;
        $stats['total_ms'] += $query->time;
        $stats['max_ms'] = max($stats['max_ms'], $query->time);
        unset($stats);
    }

    /**
     * @return list<array{sql: string, count: int, total_ms: float, max_ms: float}>
     */
    public function topPatterns(int $limit = 5): array
    {
        $patterns = array_values($this->patterns);

        usort(
            $patterns,
            fn (array $a, array $b): int => $b['total_ms'] <=> $a['total_ms']
        );

        return array_slice($patterns, 0, $limit);
    }

    private function normalizeSql(string $sql): string
    {
        return preg_replace('/\s+/', ' ', trim($sql)) ?? trim($sql);
    }
}
