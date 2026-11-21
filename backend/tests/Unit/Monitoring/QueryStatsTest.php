<?php

namespace Tests\Unit\Monitoring;

use App\Monitoring\QueryStats;
use Illuminate\Database\Connection;
use Illuminate\Database\Events\QueryExecuted;
use Mockery;
use Tests\TestCase;

class QueryStatsTest extends TestCase
{
    public function test_groups_by_parameterized_sql_fingerprint(): void
    {
        $stats = new QueryStats;
        $stats->record($this->queryEvent('select * from units where id = ?', [1], 10.0));
        $stats->record($this->queryEvent('select * from units where id = ?', [2], 20.0));
        $stats->record($this->queryEvent('select * from tenancies where unit_id = ?', [1], 5.0));

        $this->assertSame(3, $stats->count);
        $this->assertCount(2, $stats->patterns);

        $top = $stats->topPatterns(1);
        $this->assertCount(1, $top);
        $this->assertSame(2, $top[0]['count']);
        $this->assertSame(30.0, $top[0]['total_ms']);
        $this->assertStringContainsString('units', $top[0]['sql']);
        $this->assertStringNotContainsString('1', $top[0]['sql']);
    }

    /**
     * @param  list<mixed>  $bindings
     */
    private function queryEvent(string $sql, array $bindings, float $time): QueryExecuted
    {
        $connection = Mockery::mock(Connection::class);
        $connection->shouldReceive('getName')->andReturn('pgsql');

        return new QueryExecuted($sql, $bindings, $time, $connection);
    }
}
