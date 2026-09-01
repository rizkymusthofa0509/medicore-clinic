<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            BranchSeeder::class,
            AdminSeeder::class,
            DepoObatSeeder::class,
            MasterDataSeeder::class,
            TindakanSeeder::class,
            NakesSeeder::class,
            AsuransiSeeder::class,
            AturanPakaiSeeder::class,
            ObatAlkesSeeder::class,
        ]);
    }
}
