<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\DepoObat;
use Illuminate\Database\Seeder;

class DepoObatSeeder extends Seeder
{
    public function run(): void
    {
        $perBranch = [
            'BR-001' => [
                ['nama_depo' => 'Depo Utama Lt.1', 'lokasi' => 'Lantai 1', 'keterangan' => 'Depo utama untuk rawat jalan'],
                ['nama_depo' => 'Depo Rawat Inap', 'lokasi' => 'Lantai 3', 'keterangan' => 'Depo khusus rawat inap'],
                ['nama_depo' => 'Depo IGD', 'lokasi' => 'Lantai 1', 'keterangan' => null],
            ],
            'BR-002' => [
                ['nama_depo' => 'Depo Utama Kelapa Gading', 'lokasi' => 'Lantai 1', 'keterangan' => 'Depo utama cabang KG'],
                ['nama_depo' => 'Depo Gigi', 'lokasi' => 'Lantai 2', 'keterangan' => null],
            ],
        ];

        foreach ($perBranch as $code => $depos) {
            $branch = Branch::where('code', $code)->first();
            if (! $branch) {
                continue;
            }

            foreach ($depos as $d) {
                DepoObat::updateOrCreate(
                    [
                        'branch_id' => $branch->id,
                        'nama_depo' => $d['nama_depo'],
                    ],
                    array_merge($d, [
                        'branch_id' => $branch->id,
                        'status' => 'aktif',
                    ]),
                );
            }
        }
    }
}
