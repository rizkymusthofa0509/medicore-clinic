<?php

namespace Database\Seeders;

use App\Models\Asuransi;
use App\Models\Branch;
use Illuminate\Database\Seeder;

class AsuransiSeeder extends Seeder
{
    public function run(): void
    {
        $perBranch = [
            'BR-001' => [
                ['nama_perusahaan' => 'BPJS Kesehatan', 'harga_obat_khusus' => false, 'status_aktif' => true],
                ['nama_perusahaan' => 'Prudential Life Assurance', 'harga_obat_khusus' => true, 'status_aktif' => true],
                ['nama_perusahaan' => 'Allianz Life Indonesia', 'harga_obat_khusus' => true, 'status_aktif' => true],
                ['nama_perusahaan' => 'AXA Mandiri Financial Services', 'harga_obat_khusus' => true, 'status_aktif' => true],
                ['nama_perusahaan' => 'Manulife Indonesia', 'harga_obat_khusus' => false, 'status_aktif' => true],
                ['nama_perusahaan' => 'Sinarmas MSIG', 'harga_obat_khusus' => false, 'status_aktif' => false],
            ],
            'BR-002' => [
                ['nama_perusahaan' => 'BPJS Kesehatan', 'harga_obat_khusus' => false, 'status_aktif' => true],
                ['nama_perusahaan' => 'Prudential Life Assurance', 'harga_obat_khusus' => true, 'status_aktif' => true],
                ['nama_perusahaan' => 'Cigna Indonesia', 'harga_obat_khusus' => true, 'status_aktif' => true],
                ['nama_perusahaan' => 'Astra Life', 'harga_obat_khusus' => false, 'status_aktif' => true],
            ],
        ];

        foreach ($perBranch as $branchCode => $items) {
            $branch = Branch::where('code', $branchCode)->first();
            if (! $branch) continue;

            foreach ($items as $row) {
                Asuransi::firstOrCreate(
                    ['branch_id' => $branch->id, 'nama_perusahaan' => $row['nama_perusahaan']],
                    array_merge($row, ['branch_id' => $branch->id]),
                );
            }
        }
    }
}
