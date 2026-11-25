<?php

namespace App\Domain\Rentals;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

final class OwnerPropertyFilters
{
    /** @var list<string> */
    public const OCCUPANCY = [
        'OCCUPIED',
        'VACANT',
        'MAINTENANCE',
        'PENDING_CONFIRMATION',
        'AWAITING_MOVE_IN',
    ];

    /** @var list<string> */
    public const LISTING_STATUS = [
        'published',
        'pending',
        'hidden',
        'none',
        'draft',
        'rejected',
        'approved',
        'suspended',
    ];

    /**
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $query
     * @return Builder<TModel>
     */
    public static function applyOccupancy(
        Builder $query,
        string $filter,
        ?CarbonImmutable $today = null,
        ?CarbonImmutable $now = null,
    ): Builder {
        if ($filter === 'all' || ! in_array($filter, self::OCCUPANCY, true)) {
            return $query;
        }

        $today ??= CarbonImmutable::now('Asia/Ho_Chi_Minh')->startOfDay();
        $now ??= CarbonImmutable::now('Asia/Ho_Chi_Minh');

        return $query->whereHas(
            'units',
            fn (Builder $units) => self::constrainUnit($units, $filter, $today, $now),
        );
    }

    /**
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $query
     * @param  list<string>  $filters
     * @return Builder<TModel>
     */
    public static function applyListingStatuses(Builder $query, array $filters): Builder
    {
        $selected = array_values(array_unique(array_filter(
            $filters,
            fn (string $filter): bool => in_array($filter, self::LISTING_STATUS, true),
        )));

        if ($selected === []) {
            return $query;
        }

        return $query->where(function (Builder $match) use ($selected): void {
            foreach ($selected as $filter) {
                $match->orWhere(function (Builder $clause) use ($filter): void {
                    self::constrainListingStatus($clause, $filter);
                });
            }
        });
    }

    /**
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $units
     * @return Builder<TModel>
     */
    private static function constrainUnit(
        Builder $units,
        string $filter,
        CarbonImmutable $today,
        CarbonImmutable $now,
    ): Builder {
        $units->whereNull('archived_at');

        if ($filter === 'MAINTENANCE') {
            return $units->where('operational_status', 'MAINTENANCE');
        }

        if ($filter === 'VACANT') {
            return $units
                ->where('operational_status', 'READY')
                ->whereDoesntHave(
                    'tenancies',
                    fn (Builder $tenancies) => $tenancies->where(function (Builder $hold) use ($today, $now): void {
                        self::activeHold($hold, $today);
                        $hold->orWhere(function (Builder $pending) use ($today, $now): void {
                            self::pendingHold($pending, $today, $now);
                        });
                        $hold->orWhere(function (Builder $confirmed) use ($today): void {
                            self::confirmedHold($confirmed, $today);
                        });
                    }),
                );
        }

        $units->where('operational_status', '!=', 'RETIRED');

        if ($filter === 'OCCUPIED') {
            return $units->whereHas(
                'tenancies',
                fn (Builder $tenancies) => self::activeHold($tenancies, $today),
            );
        }

        if ($filter === 'PENDING_CONFIRMATION') {
            return $units
                ->whereHas(
                    'tenancies',
                    fn (Builder $tenancies) => self::pendingHold($tenancies, $today, $now),
                )
                ->whereDoesntHave(
                    'tenancies',
                    fn (Builder $tenancies) => self::activeHold($tenancies, $today),
                );
        }

        return $units
            ->whereHas(
                'tenancies',
                fn (Builder $tenancies) => self::confirmedHold($tenancies, $today),
            )
            ->whereDoesntHave(
                'tenancies',
                fn (Builder $tenancies) => $tenancies->where(function (Builder $hold) use ($today, $now): void {
                    self::activeHold($hold, $today);
                    $hold->orWhere(function (Builder $pending) use ($today, $now): void {
                        self::pendingHold($pending, $today, $now);
                    });
                }),
            );
    }

    /**
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $query
     */
    private static function constrainListingStatus(Builder $query, string $filter): void
    {
        if ($filter === 'none') {
            $query->whereDoesntHave(
                'currentListing',
                fn (Builder $listing) => $listing->whereNull('archived_at'),
            );

            return;
        }

        $query->whereHas('currentListing', function (Builder $listing) use ($filter): void {
            $listing->whereNull('archived_at');

            if ($filter === 'suspended') {
                $listing->whereNotNull('admin_suspended_at');

                return;
            }

            if ($filter === 'published') {
                $listing
                    ->where('publication_status', 'PUBLISHED')
                    ->whereNull('admin_suspended_at');

                return;
            }

            if ($filter === 'hidden') {
                $listing
                    ->where('publication_status', 'HIDDEN')
                    ->whereNull('admin_suspended_at');

                return;
            }

            $listing
                ->whereNull('admin_suspended_at')
                ->whereNotIn('publication_status', ['PUBLISHED', 'HIDDEN']);

            if ($filter === 'pending') {
                $listing->where('moderation_status', 'PENDING');

                return;
            }

            if ($filter === 'rejected') {
                $listing->where('moderation_status', 'REJECTED');

                return;
            }

            if ($filter === 'approved') {
                $listing->where('moderation_status', 'APPROVED');

                return;
            }

            $listing->whereNotIn(
                'moderation_status',
                ['PENDING', 'REJECTED', 'APPROVED'],
            );
        });
    }

    /**
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $query
     * @return Builder<TModel>
     */
    private static function activeHold(Builder $query, CarbonImmutable $today): Builder
    {
        return $query
            ->where('status', 'ACTIVE')
            ->where(fn (Builder $span) => self::coversToday($span, $today));
    }

    /**
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $query
     * @return Builder<TModel>
     */
    private static function pendingHold(
        Builder $query,
        CarbonImmutable $today,
        CarbonImmutable $now,
    ): Builder {
        return $query
            ->whereIn('status', ['PENDING_CONFIRMATION', 'AWAITING_REVISION'])
            ->where(function (Builder $span) use ($today): void {
                $span->where(fn (Builder $current) => self::coversToday($current, $today))
                    ->orWhere(fn (Builder $upcoming) => self::startsAfter($upcoming, $today));
            })
            ->where(function (Builder $open) use ($now): void {
                $open->whereNull('confirmation_expires_at')
                    ->orWhere('confirmation_expires_at', '>', $now);
            });
    }

    /**
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $query
     * @return Builder<TModel>
     */
    private static function confirmedHold(Builder $query, CarbonImmutable $today): Builder
    {
        return $query
            ->where('status', 'CONFIRMED')
            ->where(function (Builder $span) use ($today): void {
                $span->where(fn (Builder $current) => self::coversToday($current, $today))
                    ->orWhere(fn (Builder $upcoming) => self::startsAfter($upcoming, $today));
            });
    }

    /**
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $query
     * @return Builder<TModel>
     */
    private static function coversToday(Builder $query, CarbonImmutable $today): Builder
    {
        $date = $today->toDateString();

        return $query->where(function (Builder $match) use ($date): void {
            $match->where(function (Builder $confirmed) use ($date): void {
                $confirmed
                    ->whereNotNull('confirmed_start_date')
                    ->where('confirmed_start_date', '<=', $date)
                    ->whereNotNull('confirmed_end_date')
                    ->where('confirmed_end_date', '>=', $date);
            })->orWhere(function (Builder $confirmedStart) use ($date): void {
                $confirmedStart
                    ->whereNotNull('confirmed_start_date')
                    ->where('confirmed_start_date', '<=', $date)
                    ->whereNull('confirmed_end_date')
                    ->whereNotNull('blocked_end_date')
                    ->where('blocked_end_date', '>=', $date);
            })->orWhere(function (Builder $blockedStart) use ($date): void {
                $blockedStart
                    ->whereNull('confirmed_start_date')
                    ->whereNotNull('blocked_start_date')
                    ->where('blocked_start_date', '<=', $date)
                    ->whereNotNull('confirmed_end_date')
                    ->where('confirmed_end_date', '>=', $date);
            })->orWhere(function (Builder $blocked) use ($date): void {
                $blocked
                    ->whereNull('confirmed_start_date')
                    ->whereNull('confirmed_end_date')
                    ->whereNotNull('blocked_start_date')
                    ->where('blocked_start_date', '<=', $date)
                    ->whereNotNull('blocked_end_date')
                    ->where('blocked_end_date', '>=', $date);
            });
        });
    }

    /**
     * @template TModel of Model
     *
     * @param  Builder<TModel>  $query
     * @return Builder<TModel>
     */
    private static function startsAfter(Builder $query, CarbonImmutable $today): Builder
    {
        $date = $today->toDateString();

        return $query->where(function (Builder $match) use ($date): void {
            $match->where(function (Builder $confirmed) use ($date): void {
                $confirmed
                    ->whereNotNull('confirmed_start_date')
                    ->where('confirmed_start_date', '>', $date)
                    ->where(function (Builder $end) {
                        $end->whereNotNull('confirmed_end_date')
                            ->orWhereNotNull('blocked_end_date');
                    });
            })->orWhere(function (Builder $blocked) use ($date): void {
                $blocked
                    ->whereNull('confirmed_start_date')
                    ->whereNotNull('blocked_start_date')
                    ->where('blocked_start_date', '>', $date)
                    ->where(function (Builder $end) {
                        $end->whereNotNull('confirmed_end_date')
                            ->orWhereNotNull('blocked_end_date');
                    });
            });
        });
    }
}
