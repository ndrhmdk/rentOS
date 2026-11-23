<?php

namespace App\Console\Commands;

use App\Actions\RentalRequests\RejectAgedRentalRequestAction;
use App\Models\RentalRequest;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Throwable;

#[Signature('rentals:reject-aged {--dry-run : Scan and report eligible requests without persisting changes}')]
#[Description('Scan pending rental requests aged 15 days or older and reject those with no eligible available units.')]
class RejectAgedRentalRequests extends Command
{
    public function handle(RejectAgedRentalRequestAction $action): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $cutoff = now()->subDays(15);

        $query = RentalRequest::query()
            ->where('status', 'PENDING')
            ->where('created_at', '<=', $cutoff);

        $totalCount = (clone $query)->count();

        $this->info("Found {$totalCount} pending rental request(s) aged >= 15 days.");

        $rejected = 0;
        $kept = 0;

        foreach ($query->lazyById(100) as $request) {
            try {
                if ($dryRun) {
                    $result = $action->execute($request->id, dryRun: true);

                    if ($result === 'REJECTED') {
                        $rejected++;
                        $this->line("DRY-RUN: Request {$request->id} would be REJECTED (NO_AVAILABLE_UNIT).");
                    } elseif ($result === 'PENDING_KEPT') {
                        $kept++;
                        $this->line("DRY-RUN: Request {$request->id} would be KEPT.");
                    }

                    continue;
                }

                $result = $action->execute($request->id);

                if ($result === 'REJECTED') {
                    $rejected++;
                    $this->line("Request {$request->id}: REJECTED (NO_AVAILABLE_UNIT).");
                } elseif ($result === 'PENDING_KEPT') {
                    $kept++;
                    $this->line("Request {$request->id}: PENDING_KEPT (eligible unit available).");
                }
            } catch (Throwable $e) {
                Log::error("Failed to process aged rental request {$request->id}: {$e->getMessage()}", [
                    'request_id' => $request->id,
                    'exception' => $e,
                ]);
                $this->error("Failed to process aged rental request {$request->id}: {$e->getMessage()}");
            }
        }

        $this->info("Completed aged rental requests sweep: {$rejected} rejected, {$kept} retained pending.");

        return self::SUCCESS;
    }
}
