<?php

namespace Database\Seeders;

use App\Models\Branch;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        $branches = [
            [
                'name' => 'Klinik Medicore Pusat',
                'code' => 'BR-001',
                'address' => 'Jl. Raya Kuningan No. 88, Jakarta Selatan',
                'phone' => '(021) 555-0101',
                'operational_hours' => '08:00 - 20:00',
                'status' => 'aktif',
            ],
            [
                'name' => 'Klinik Medicore Kelapa Gading',
                'code' => 'BR-002',
                'address' => 'Jl. Kelapa Gading Raya No. 45, Jakarta Utara',
                'phone' => '(021) 555-0202',
                'operational_hours' => '08:00 - 18:00',
                'status' => 'aktif',
            ],
        ];

        foreach ($branches as $branch) {
            Branch::create($branch);
        }
    }
}
