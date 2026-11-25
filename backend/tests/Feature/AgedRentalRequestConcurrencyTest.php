<?php

namespace Tests\Feature;

use App\Actions\RentalRequests\RejectAgedRentalRequestAction;
use App\Models\RentalRequest;
use App\Models\User;
use Closure;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Concurrency;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Support\PublicListingFixture;
use Tests\TestCase;

/**
 * Runs the aged-request rejection and a tenant withdrawal in two separate
 * processes (two PostgreSQL connections) so the row locks really compete.
 */
class AgedRentalRequestConcurrencyTest extends TestCase
{
    use DatabaseMigrations;

    protected function beforeRefreshingDatabase(): void
    {
        $this->assertSame('pgsql', config('database.default'));
        $this->assertSame('rentos_test', config('database.connections.pgsql.database'));
        $this->assertContains(config('database.connections.pgsql.host'), ['rentos-rnt04-db', '127.0.0.1', 'localhost']);
    }

    public function test_ageing_and_tenant_withdrawal_commit_exactly_one_outcome(): void
    {
        $listing = PublicListingFixture::published();
        DB::transaction(function () use ($listing): void {
            PublicListingFixture::blockUnit($listing->unitIds[0], now()->addDay()->toDateString(), now()->addMonths(6)->toDateString());
        });
        $tenant = User::factory()->create();
        $request = RentalRequest::factory()->create([
            'tenant_id' => $tenant->id,
            'listing_id' => $listing->listingId,
            'created_at' => now()->subDays(16),
            'desired_move_in_date' => now()->addDays(5)->toDateString(),
            'desired_end_date' => now()->addMonths(3)->toDateString(),
            'status' => 'PENDING',
        ])->refresh();
        $withdrawPayload = [
            'client_operation_id' => (string) Str::uuid(),
            'expected_updated_at' => $request->updated_at->format('Y-m-d\TH:i:s.uP'),
        ];

        [$ageingResult, $withdrawStatus] = Concurrency::driver('process')->run([
            $this->ageInProcess($request->id),
            $this->withdrawInProcess($tenant->id, $request->id, $withdrawPayload),
        ], timeout: 20);

        $status = (string) DB::table('rental_requests')->where('id', $request->id)->value('status');
        $this->assertContains($status, ['REJECTED', 'WITHDRAWN']);

        if ($status === 'REJECTED') {
            $this->assertSame('REJECTED', $ageingResult);
            $this->assertSame(409, $withdrawStatus);
            $event = 'rental_request.rejected_aged';
        } else {
            $this->assertNull($ageingResult);
            $this->assertSame(204, $withdrawStatus);
            $event = 'rental_request.withdrawn';
        }

        $this->assertSame(1, DB::table('audit_logs')->where('entity_id', $request->id)->count());
        $this->assertDatabaseHas('audit_logs', ['entity_id' => $request->id, 'action' => $event]);
        $this->assertSame(1, DB::table('notifications')->where('event_key', 'like', '%:'.$request->id)->count());
    }

    private function ageInProcess(string $requestId): Closure
    {
        return static function () use ($requestId): ?string {
            abort_unless(config('database.connections.pgsql.database') === 'rentos_test', 500);

            return app(RejectAgedRentalRequestAction::class)->execute($requestId);
        };
    }

    /** @param array<string, string> $payload */
    private function withdrawInProcess(string $tenantId, string $requestId, array $payload): Closure
    {
        return static function () use ($tenantId, $requestId, $payload): int {
            abort_unless(config('database.connections.pgsql.database') === 'rentos_test', 500);

            Auth::guard('web')->setUser(User::query()->findOrFail($tenantId));
            $request = Request::create('/api/v1/tenant/rental-requests/'.$requestId.'/withdraw', 'POST', server: [
                'HTTP_ACCEPT' => 'application/json',
                'CONTENT_TYPE' => 'application/json',
            ], content: json_encode($payload, JSON_THROW_ON_ERROR));

            return app(Kernel::class)->handle($request)->getStatusCode();
        };
    }
}
