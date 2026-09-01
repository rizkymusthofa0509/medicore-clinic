<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Poli;
use App\Models\Tindakan;
use Illuminate\Database\Seeder;

class TindakanSeeder extends Seeder
{
    public function run(): void
    {
        $perBranch = [
            'BR-001' => [
                [
                    'kode_icd9' => '99.0',
                    'nama_tindakan' => 'Injeksi Intravena',
                    'kelompok_tindakan' => 'Tindakan Umum',
                    'poli_kode' => 'PL-UM',
                    'jumlah_biaya' => 50000,
                    'jasa_dokter' => 15000, 'persentase_dokter' => 30, 'rupiah_dokter' => 15000,
                    'jasa_asisten' => 10000, 'persentase_asisten' => 20, 'rupiah_asisten' => 10000,
                    'jasa_klinik' => 25000, 'persentase_klinik' => 50, 'rupiah_klinik' => 25000,
                ],
                [
                    'kode_icd9' => '89.7',
                    'nama_tindakan' => 'Pemeriksaan Fisik Lengkap',
                    'kelompok_tindakan' => 'Pemeriksaan',
                    'poli_kode' => 'PL-UM',
                    'jumlah_biaya' => 100000,
                    'jasa_dokter' => 50000, 'persentase_dokter' => 50, 'rupiah_dokter' => 50000,
                    'jasa_asisten' => 10000, 'persentase_asisten' => 10, 'rupiah_asisten' => 10000,
                    'jasa_klinik' => 40000, 'persentase_klinik' => 40, 'rupiah_klinik' => 40000,
                ],
                [
                    'kode_icd9' => '23.01',
                    'nama_tindakan' => 'Pencabutan Gigi',
                    'kelompok_tindakan' => 'Bedah Minor',
                    'poli_kode' => 'PL-GI',
                    'jumlah_biaya' => 250000,
                    'jasa_dokter' => 125000, 'persentase_dokter' => 50, 'rupiah_dokter' => 125000,
                    'jasa_asisten' => 37500, 'persentase_asisten' => 15, 'rupiah_asisten' => 37500,
                    'jasa_klinik' => 87500, 'persentase_klinik' => 35, 'rupiah_klinik' => 87500,
                ],
                [
                    'kode_icd9' => '23.19',
                    'nama_tindakan' => 'Tambal Gigi Permanen',
                    'kelompok_tindakan' => 'Tindakan Gigi',
                    'poli_kode' => 'PL-GI',
                    'jumlah_biaya' => 300000,
                    'jasa_dokter' => 150000, 'persentase_dokter' => 50, 'rupiah_dokter' => 150000,
                    'jasa_asisten' => 45000, 'persentase_asisten' => 15, 'rupiah_asisten' => 45000,
                    'jasa_klinik' => 105000, 'persentase_klinik' => 35, 'rupiah_klinik' => 105000,
                ],
                [
                    'kode_icd9' => '89.04',
                    'nama_tindakan' => 'Konsultasi Dokter Anak',
                    'kelompok_tindakan' => 'Konsultasi',
                    'poli_kode' => 'PL-AN',
                    'jumlah_biaya' => 150000,
                    'jasa_dokter' => 90000, 'persentase_dokter' => 60, 'rupiah_dokter' => 90000,
                    'jasa_asisten' => 15000, 'persentase_asisten' => 10, 'rupiah_asisten' => 15000,
                    'jasa_klinik' => 45000, 'persentase_klinik' => 30, 'rupiah_klinik' => 45000,
                ],
                [
                    'kode_icd9' => '38.91',
                    'nama_tindakan' => 'Pemasangan Infus',
                    'kelompok_tindakan' => 'Rawat Inap',
                    'poli_kode' => 'RI-IN',
                    'jumlah_biaya' => 75000,
                    'jasa_dokter' => 22500, 'persentase_dokter' => 30, 'rupiah_dokter' => 22500,
                    'jasa_asisten' => 22500, 'persentase_asisten' => 30, 'rupiah_asisten' => 22500,
                    'jasa_klinik' => 30000, 'persentase_klinik' => 40, 'rupiah_klinik' => 30000,
                ],
            ],
            'BR-002' => [
                [
                    'kode_icd9' => '99.0',
                    'nama_tindakan' => 'Injeksi Intravena',
                    'kelompok_tindakan' => 'Tindakan Umum',
                    'poli_kode' => 'PL-UM',
                    'jumlah_biaya' => 60000,
                    'jasa_dokter' => 18000, 'persentase_dokter' => 30, 'rupiah_dokter' => 18000,
                    'jasa_asisten' => 12000, 'persentase_asisten' => 20, 'rupiah_asisten' => 12000,
                    'jasa_klinik' => 30000, 'persentase_klinik' => 50, 'rupiah_klinik' => 30000,
                ],
                [
                    'kode_icd9' => '89.7',
                    'nama_tindakan' => 'Pemeriksaan Fisik Lengkap',
                    'kelompok_tindakan' => 'Pemeriksaan',
                    'poli_kode' => 'PL-UM',
                    'jumlah_biaya' => 120000,
                    'jasa_dokter' => 60000, 'persentase_dokter' => 50, 'rupiah_dokter' => 60000,
                    'jasa_asisten' => 12000, 'persentase_asisten' => 10, 'rupiah_asisten' => 12000,
                    'jasa_klinik' => 48000, 'persentase_klinik' => 40, 'rupiah_klinik' => 48000,
                ],
                [
                    'kode_icd9' => '23.01',
                    'nama_tindakan' => 'Pencabutan Gigi',
                    'kelompok_tindakan' => 'Bedah Minor',
                    'poli_kode' => 'PL-GI',
                    'jumlah_biaya' => 280000,
                    'jasa_dokter' => 140000, 'persentase_dokter' => 50, 'rupiah_dokter' => 140000,
                    'jasa_asisten' => 42000, 'persentase_asisten' => 15, 'rupiah_asisten' => 42000,
                    'jasa_klinik' => 98000, 'persentase_klinik' => 35, 'rupiah_klinik' => 98000,
                ],
            ],
        ];

        foreach ($perBranch as $branchCode => $items) {
            $branch = Branch::where('code', $branchCode)->first();
            if (! $branch) {
                continue;
            }

            foreach ($items as $t) {
                $poliId = Poli::where('branch_id', $branch->id)
                    ->where('kode', $t['poli_kode'])
                    ->value('id');

                Tindakan::updateOrCreate(
                    [
                        'branch_id' => $branch->id,
                        'kode_icd9' => $t['kode_icd9'],
                    ],
                    [
                        'branch_id' => $branch->id,
                        'poli_id' => $poliId,
                        'kelompok_tindakan' => $t['kelompok_tindakan'],
                        'kode_icd9' => $t['kode_icd9'],
                        'nama_tindakan' => $t['nama_tindakan'],
                        'jumlah_biaya' => $t['jumlah_biaya'],
                        'jasa_dokter' => $t['jasa_dokter'],
                        'persentase_dokter' => $t['persentase_dokter'],
                        'rupiah_dokter' => $t['rupiah_dokter'],
                        'jasa_asisten' => $t['jasa_asisten'],
                        'persentase_asisten' => $t['persentase_asisten'],
                        'rupiah_asisten' => $t['rupiah_asisten'],
                        'jasa_klinik' => $t['jasa_klinik'],
                        'persentase_klinik' => $t['persentase_klinik'],
                        'rupiah_klinik' => $t['rupiah_klinik'],
                        'status' => 'aktif',
                    ],
                );
            }
        }
    }
}
