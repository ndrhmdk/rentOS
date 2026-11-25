<?php

namespace Tests\Unit;

use App\Domain\Rentals\UnitOccupancy;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;
use stdClass;

class UnitOccupancyTest extends TestCase
{
    public function test_active_hold_covering_today_is_occupied(): void
    {
        $today = CarbonImmutable::parse('2026-11-25', 'Asia/Ho_Chi_Minh');
        $tenancy = (object) [
            'id' => 'tenancy-1',
            'status' => 'ACTIVE',
            'confirmed_start_date' => '2026-11-01',
            'confirmed_end_date' => '2027-05-01',
            'tenant' => (object) ['name' => 'Minh'],
        ];

        $result = UnitOccupancy::classify('READY', [$tenancy], $today, $today);

        $this->assertSame('OCCUPIED', $result['rental']);
        $this->assertSame('Minh', $result['tenant_name']);
        $this->assertTrue($result['occupied']);
    }

    public function test_confirmed_upcoming_is_awaiting_move_in(): void
    {
        $today = CarbonImmutable::parse('2026-11-25', 'Asia/Ho_Chi_Minh');
        $tenancy = (object) [
            'id' => 'tenancy-2',
            'status' => 'CONFIRMED',
            'confirmed_start_date' => '2026-12-01',
            'confirmed_end_date' => '2027-06-01',
            'tenant' => (object) ['name' => 'Lan'],
        ];

        $result = UnitOccupancy::classify('READY', [$tenancy], $today, $today);

        $this->assertSame('AWAITING_MOVE_IN', $result['rental']);
        $this->assertTrue($result['awaiting_move_in']);
    }

    public function test_list_badge_counts_separate_units(): void
    {
        $units = [
            UnitOccupancy::classify('READY', []),
            UnitOccupancy::classify('MAINTENANCE', []),
            UnitOccupancy::classify('READY', [
                (object) [
                    'id' => 't1',
                    'status' => 'ACTIVE',
                    'confirmed_start_date' => '2026-11-01',
                    'confirmed_end_date' => '2027-01-01',
                    'tenant' => new stdClass,
                ],
            ], CarbonImmutable::parse('2026-11-25'), CarbonImmutable::parse('2026-11-25')),
        ];

        $badge = UnitOccupancy::listBadge('SEPARATE_UNITS', $units);

        $this->assertSame('counts', $badge['kind']);
        $this->assertSame(
            ['OCCUPIED', 'VACANT', 'MAINTENANCE'],
            array_column($badge['items'], 'status'),
        );
    }

    public function test_whole_space_badge_is_a_single_status(): void
    {
        $badge = UnitOccupancy::listBadge('WHOLE_SPACE', [
            UnitOccupancy::classify('READY', []),
        ]);

        $this->assertSame([
            'kind' => 'single',
            'status' => 'VACANT',
            'label' => 'Còn trống',
        ], $badge);
    }
}
