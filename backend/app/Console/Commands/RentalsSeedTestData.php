<?php

namespace App\Console\Commands;

use Database\Seeders\Rnt11AgedRequestsSeeder;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('rentals:seed-test-data')]
#[Description('Inject standardized test data for RNT-11 (15-day rule test cases) into local database.')]
class RentalsSeedTestData extends Command
{
    public function handle(Rnt11AgedRequestsSeeder $seeder): int
    {
        $seeder->setCommand($this);
        $seeder->run(clean: false);

        return self::SUCCESS;
    }
}
