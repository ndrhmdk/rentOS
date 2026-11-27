<?php

namespace App\Console\Commands;

use Database\Seeders\Rnt11AgedRequestsSeeder;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('rentals:cleanup-test-data')]
#[Description('Clean up all RNT-11 test fixtures and restore the database to its clean state.')]
class RentalsCleanupTestData extends Command
{
    public function handle(Rnt11AgedRequestsSeeder $seeder): int
    {
        $seeder->setCommand($this);
        $seeder->cleanUp();

        return self::SUCCESS;
    }
}
