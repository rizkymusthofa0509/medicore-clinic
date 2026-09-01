<?php

namespace Database\Seeders;

use App\Models\AturanPakai;
use App\Models\Branch;
use Illuminate\Database\Seeder;

class AturanPakaiSeeder extends Seeder
{
    public function run(): void
    {
        $shared = [
            ['aturan' => '3x sehari 1 tablet sesudah makan', 'status_aktif' => true],
            ['aturan' => '2x sehari 1 tablet sesudah makan', 'status_aktif' => true],
            ['aturan' => '2x sehari 1 tablet sebelum makan', 'status_aktif' => true],
            ['aturan' => '1x sehari 1 tablet sesudah makan', 'status_aktif' => true],
            ['aturan' => '1x sehari 1 tablet sebelum makan', 'status_aktif' => true],
            ['aturan' => '3x sehari 1 kaplet sesudah makan', 'status_aktif' => true],
            ['aturan' => '4x sehari 1 tablet (setiap 6 jam)', 'status_aktif' => true],
            ['aturan' => 'Jika demam, 3x sehari 1 tablet', 'status_aktif' => true],
            ['aturan' => 'Jika sakit, 1 tablet (maks 3x sehari)', 'status_aktif' => true],
            ['aturan' => 'Diminum sampai habis', 'status_aktif' => true],
            ['aturan' => 'Dioleskan 2x sehari pada bagian yang sakit', 'status_aktif' => true],
            ['aturan' => 'Teteskan 2-3 tetes pada mata yang sakit, 3x sehari', 'status_aktif' => true],
            ['aturan' => '1 sachet dicampur air 200ml, diminum 2x sehari', 'status_aktif' => true],
            ['aturan' => 'Injeksi intravena setiap 8 jam (petugas medis)', 'status_aktif' => true],
            ['aturan' => 'Injeksi intramuscular setiap 12 jam (petugas medis)', 'status_aktif' => true],
            // Nonaktif sebagai contoh
            ['aturan' => 'ATURAN LAMA (deprecated)', 'status_aktif' => false],
        ];

        foreach (Branch::all() as $branch) {
            foreach ($shared as $row) {
                AturanPakai::updateOrCreate(
                    ['branch_id' => $branch->id, 'aturan' => $row['aturan']],
                    array_merge($row, ['branch_id' => $branch->id]),
                );
            }
        }
    }
}
