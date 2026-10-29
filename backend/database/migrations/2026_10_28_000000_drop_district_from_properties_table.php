<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $this->replaceDistrictRequirement(addRequirement: false);

        Schema::table('properties', function ($table) {
            $table->dropColumn('district');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('properties', function ($table) {
            $table->text('district')->nullable();
        });

        $this->replaceDistrictRequirement(addRequirement: true);
    }

    private function replaceDistrictRequirement(bool $addRequirement): void
    {
        $function = DB::selectOne(
            "SELECT pg_get_functiondef('public.validate_listing_cover(uuid)'::regprocedure) AS definition",
        )->definition;

        $districtRequirement = "                          AND property.district IS NOT NULL\n"
            . "                          AND btrim(property.district) <> ''\n";

        if ($addRequirement) {
            $addressRequirement = "                          AND btrim(property.address_line) <> ''\n";
            if (! str_contains($function, $addressRequirement)) {
                throw new RuntimeException('Could not restore the listing address requirements.');
            }

            $function = str_replace(
                $addressRequirement,
                $addressRequirement.$districtRequirement,
                $function,
            );
        } else {
            if (! str_contains($function, $districtRequirement)) {
                throw new RuntimeException('Could not remove the listing district requirement.');
            }

            $function = str_replace($districtRequirement, '', $function);
        }

        DB::unprepared($function);
    }
};
