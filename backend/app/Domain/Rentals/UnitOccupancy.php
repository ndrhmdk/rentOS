<?php

namespace App\Domain\Rentals;

use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

/**
 * Classifies a unit's current rental and operational state for owner views.
 *
 * Ranking matches rental_platform's occupancy rules:
 * ACTIVE covering today > open PENDING_CONFIRMATION/AWAITING_REVISION >
 * CONFIRMED covering today or upcoming > vacant.
 */
final class UnitOccupancy
{
    public const string OCCUPIED = 'OCCUPIED';

    public const string AWAITING_MOVE_IN = 'AWAITING_MOVE_IN';

    public const string PENDING_CONFIRMATION = 'PENDING_CONFIRMATION';

    public const string VACANT = 'VACANT';

    public const string MAINTENANCE = 'MAINTENANCE';

    public const string RETIRED = 'RETIRED';

    public const string EMPTY = 'EMPTY';

    public const string READY = 'READY';

    /** @var array<string, string> */
    public const array LABELS = [
        self::OCCUPIED => 'Đang thuê',
        self::AWAITING_MOVE_IN => 'Chờ dọn vào',
        self::PENDING_CONFIRMATION => 'Đang chờ xác nhận',
        self::VACANT => 'Còn trống',
        self::MAINTENANCE => 'Bảo trì',
        self::RETIRED => 'Ngừng hoạt động',
        self::EMPTY => 'Chưa có căn',
        self::READY => 'Bình thường',
    ];

    /**
     * @param  Collection<int, object>|iterable<object>  $tenancies
     * @return array{
     *     rental: string,
     *     operational: string,
     *     tenant_name: ?string,
     *     start_date: ?string,
     *     end_date: ?string,
     *     tenancy_id: ?string,
     *     rentable: bool,
     *     occupied: bool,
     *     vacant: bool,
     *     maintenance: bool,
     *     pending: bool,
     *     awaiting_move_in: bool
     * }
     */
    public static function classify(
        string $operationalStatus,
        iterable $tenancies,
        ?CarbonImmutable $today = null,
        ?CarbonImmutable $now = null,
    ): array {
        $today ??= CarbonImmutable::now('Asia/Ho_Chi_Minh')->startOfDay();
        $now ??= CarbonImmutable::now('Asia/Ho_Chi_Minh');
        $todayString = $today->toDateString();

        $chosen = null;
        foreach ($tenancies as $tenancy) {
            $candidate = self::candidate($tenancy, $todayString, $now);
            if ($candidate === null) {
                continue;
            }
            if (
                $chosen === null
                || $candidate['rank'] > $chosen['rank']
                || (
                    $candidate['rank'] === $chosen['rank']
                    && $candidate['span']['start'] > $chosen['span']['start']
                )
            ) {
                $chosen = $candidate;
            }
        }

        $operational = match ($operationalStatus) {
            self::MAINTENANCE, self::RETIRED => $operationalStatus,
            default => self::READY,
        };
        $rental = match ($chosen['rank'] ?? 0) {
            3 => self::OCCUPIED,
            2 => self::PENDING_CONFIRMATION,
            1 => self::AWAITING_MOVE_IN,
            default => self::VACANT,
        };
        $rentable = $operational !== self::RETIRED;

        return [
            'rental' => $rental,
            'operational' => $operational,
            'tenant_name' => self::tenantName($chosen['tenancy'] ?? null),
            'start_date' => $chosen['span']['start'] ?? null,
            'end_date' => $chosen['span']['end'] ?? null,
            'tenancy_id' => isset($chosen['tenancy'])
                ? (string) data_get($chosen['tenancy'], 'id')
                : null,
            'rentable' => $rentable,
            'occupied' => $rentable && $rental === self::OCCUPIED,
            'vacant' => $operational === self::READY && $rental === self::VACANT,
            'maintenance' => $rentable && $operational === self::MAINTENANCE,
            'pending' => $rentable && $rental === self::PENDING_CONFIRMATION,
            'awaiting_move_in' => $rentable && $rental === self::AWAITING_MOVE_IN,
        ];
    }

    /**
     * @param  list<array{
     *     rental: string,
     *     operational: string,
     *     rentable: bool,
     *     occupied: bool,
     *     vacant: bool,
     *     maintenance: bool,
     *     pending: bool,
     *     awaiting_move_in: bool
     * }>  $units
     * @return array{
     *     total: int,
     *     occupied: int,
     *     vacant: int,
     *     maintenance: int,
     *     pending: int,
     *     awaiting_move_in: int
     * }
     */
    public static function counts(array $units): array
    {
        $counts = [
            'total' => 0,
            'occupied' => 0,
            'vacant' => 0,
            'maintenance' => 0,
            'pending' => 0,
            'awaiting_move_in' => 0,
        ];

        foreach ($units as $unit) {
            if (! ($unit['rentable'] ?? false)) {
                continue;
            }
            $counts['total']++;
            if ($unit['occupied']) {
                $counts['occupied']++;
            }
            if ($unit['vacant']) {
                $counts['vacant']++;
            }
            if ($unit['maintenance']) {
                $counts['maintenance']++;
            }
            if ($unit['pending']) {
                $counts['pending']++;
            }
            if ($unit['awaiting_move_in']) {
                $counts['awaiting_move_in']++;
            }
        }

        return $counts;
    }

    /**
     * @param  list<array{
     *     rental: string,
     *     operational: string,
     *     rentable: bool,
     *     occupied: bool,
     *     vacant: bool,
     *     maintenance: bool,
     *     pending: bool,
     *     awaiting_move_in: bool
     * }>  $units
     * @return array{
     *     kind: 'single'|'counts',
     *     status?: string,
     *     label?: string,
     *     items?: list<array{status: string, label: string}>
     * }
     */
    public static function listBadge(string $arrangement, array $units): array
    {
        if ($arrangement === 'WHOLE_SPACE') {
            $unit = $units[0] ?? null;
            if ($unit === null) {
                return self::single(self::EMPTY);
            }

            return self::single(self::wholeSpaceStatus($unit));
        }

        $counts = self::counts($units);
        $items = [];
        if ($counts['occupied'] > 0) {
            $items[] = [
                'status' => self::OCCUPIED,
                'label' => "{$counts['occupied']} đang thuê",
            ];
        }
        if ($counts['vacant'] > 0) {
            $items[] = [
                'status' => self::VACANT,
                'label' => "{$counts['vacant']} còn trống",
            ];
        }
        if ($counts['maintenance'] > 0) {
            $items[] = [
                'status' => self::MAINTENANCE,
                'label' => "{$counts['maintenance']} bảo trì",
            ];
        }
        if ($counts['pending'] > 0) {
            $items[] = [
                'status' => self::PENDING_CONFIRMATION,
                'label' => "{$counts['pending']} chờ xác nhận",
            ];
        }
        if ($counts['awaiting_move_in'] > 0) {
            $items[] = [
                'status' => self::AWAITING_MOVE_IN,
                'label' => "{$counts['awaiting_move_in']} chờ dọn vào",
            ];
        }

        if ($items === []) {
            return self::single(self::EMPTY);
        }

        return ['kind' => 'counts', 'items' => $items];
    }

    public static function rentalLabel(string $state): string
    {
        return self::LABELS[$state] ?? $state;
    }

    public static function operationalLabel(string $state): string
    {
        if ($state === self::MAINTENANCE) {
            return self::LABELS[self::MAINTENANCE];
        }
        if ($state === self::RETIRED) {
            return self::LABELS[self::RETIRED];
        }

        return self::LABELS[self::READY];
    }

    /**
     * @param  array{
     *     rental: string,
     *     operational: string
     * }  $unit
     */
    private static function wholeSpaceStatus(array $unit): string
    {
        return match ($unit['rental']) {
            self::OCCUPIED => self::OCCUPIED,
            self::PENDING_CONFIRMATION => self::PENDING_CONFIRMATION,
            self::AWAITING_MOVE_IN => self::AWAITING_MOVE_IN,
            default => match ($unit['operational']) {
                self::MAINTENANCE => self::MAINTENANCE,
                self::RETIRED => self::RETIRED,
                default => self::VACANT,
            },
        };
    }

    /**
     * @return array{kind: 'single', status: string, label: string}
     */
    private static function single(string $status): array
    {
        return [
            'kind' => 'single',
            'status' => $status,
            'label' => self::LABELS[$status] ?? $status,
        ];
    }

    /**
     * @return array{
     *     rank: int,
     *     tenancy: object,
     *     span: array{start: string, end: string}
     * }|null
     */
    private static function candidate(
        object $tenancy,
        string $today,
        CarbonImmutable $now,
    ): ?array {
        $span = self::spanOf($tenancy);
        if ($span === null) {
            return null;
        }

        $status = (string) data_get($tenancy, 'status');
        $current = $span['start'] <= $today && $today <= $span['end'];
        $upcoming = $span['start'] > $today;

        if ($status === 'ACTIVE' && $current) {
            return ['rank' => 3, 'tenancy' => $tenancy, 'span' => $span];
        }

        if (
            in_array($status, ['PENDING_CONFIRMATION', 'AWAITING_REVISION'], true)
            && ($current || $upcoming)
            && self::confirmationOpen($tenancy, $now)
        ) {
            return ['rank' => 2, 'tenancy' => $tenancy, 'span' => $span];
        }

        if ($status === 'CONFIRMED' && ($current || $upcoming)) {
            return ['rank' => 1, 'tenancy' => $tenancy, 'span' => $span];
        }

        return null;
    }

    /**
     * @return array{start: string, end: string}|null
     */
    private static function spanOf(object $tenancy): ?array
    {
        $start = data_get($tenancy, 'confirmed_start_date')
            ?? data_get($tenancy, 'blocked_start_date');
        $end = data_get($tenancy, 'confirmed_end_date')
            ?? data_get($tenancy, 'blocked_end_date');

        $startString = self::dateString($start);
        $endString = self::dateString($end);
        if ($startString === null || $endString === null || $startString > $endString) {
            return null;
        }

        return ['start' => $startString, 'end' => $endString];
    }

    private static function confirmationOpen(object $tenancy, CarbonImmutable $now): bool
    {
        $expires = data_get($tenancy, 'confirmation_expires_at');
        if ($expires === null || $expires === '') {
            return true;
        }

        try {
            $expiresAt = $expires instanceof CarbonImmutable
                ? $expires
                : CarbonImmutable::parse((string) $expires);
        } catch (\Throwable) {
            return false;
        }

        return $expiresAt->greaterThan($now);
    }

    private static function dateString(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if ($value instanceof \DateTimeInterface) {
            return CarbonImmutable::instance($value)->toDateString();
        }

        $text = (string) $value;

        return strlen($text) >= 10 ? substr($text, 0, 10) : null;
    }

    private static function tenantName(mixed $tenancy): ?string
    {
        if ($tenancy === null) {
            return null;
        }

        $name = data_get($tenancy, 'tenant.name')
            ?? data_get($tenancy, 'tenant_name');

        return is_string($name) && $name !== '' ? $name : null;
    }
}
