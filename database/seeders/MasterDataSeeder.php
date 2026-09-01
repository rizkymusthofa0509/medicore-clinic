<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\DepoObat;
use App\Models\Poli;
use App\Models\Ruangan;
use App\Models\UnitLokasi;
use Illuminate\Database\Seeder;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        $branches = Branch::all()->keyBy('code');

        $unitsPerBranch = [
            'BR-001' => [
                ['kode' => 'RJ', 'nama_unit' => 'Rawat Jalan', 'jenis' => 'rawat_jalan', 'lokasi' => 'Lantai 1', 'keterangan' => null],
                ['kode' => 'RI', 'nama_unit' => 'Rawat Inap', 'jenis' => 'rawat_inap', 'lokasi' => 'Lantai 2-3', 'keterangan' => null],
                ['kode' => 'PJ', 'nama_unit' => 'Penunjang Medis', 'jenis' => 'penunjang', 'lokasi' => 'Lantai 1', 'keterangan' => 'Lab & Radiologi'],
            ],
            'BR-002' => [
                ['kode' => 'RJ', 'nama_unit' => 'Rawat Jalan KG', 'jenis' => 'rawat_jalan', 'lokasi' => 'Lantai 1', 'keterangan' => null],
                ['kode' => 'PJ', 'nama_unit' => 'Penunjang', 'jenis' => 'penunjang', 'lokasi' => 'Lantai 2', 'keterangan' => null],
            ],
        ];

        $polisPerBranch = [
            'BR-001' => [
                ['kode' => 'PL-UM', 'nama' => 'Poli Umum', 'jenis_poli' => 'Umum', 'antrian_ftkp' => true,  'unit' => 'RJ', 'depo' => 'Depo Utama Lt.1'],
                ['kode' => 'PL-GI', 'nama' => 'Poli Gigi', 'jenis_poli' => 'Gigi', 'antrian_ftkp' => false, 'unit' => 'RJ', 'depo' => 'Depo Utama Lt.1'],
                ['kode' => 'PL-AN', 'nama' => 'Poli Anak', 'jenis_poli' => 'Anak', 'antrian_ftkp' => true,  'unit' => 'RJ', 'depo' => 'Depo Utama Lt.1'],
                ['kode' => 'RI-IN', 'nama' => 'Ruang Inap Anggrek', 'jenis_poli' => 'Rawat Inap', 'antrian_ftkp' => false, 'unit' => 'RI', 'depo' => 'Depo Rawat Inap'],
            ],
            'BR-002' => [
                ['kode' => 'PL-UM', 'nama' => 'Poli Umum KG', 'jenis_poli' => 'Umum', 'antrian_ftkp' => true,  'unit' => 'RJ', 'depo' => 'Depo Utama Kelapa Gading'],
                ['kode' => 'PL-GI', 'nama' => 'Poli Gigi KG', 'jenis_poli' => 'Gigi', 'antrian_ftkp' => false, 'unit' => 'RJ', 'depo' => 'Depo Gigi'],
            ],
        ];

        $ruanganPerPoli = [
            'PL-UM' => [
                ['kode' => 'R-UM-01', 'nama_ruangan' => 'Ruang Periksa 1', 'kelas' => 'Utama', 'kapasitas' => 4],
                ['kode' => 'R-UM-02', 'nama_ruangan' => 'Ruang Periksa 2', 'kelas' => 'Utama', 'kapasitas' => 4],
            ],
            'PL-GI' => [
                ['kode' => 'R-GI-01', 'nama_ruangan' => 'Kursi Gigi 1', 'kelas' => 'Standar', 'kapasitas' => 1],
            ],
            'PL-AN' => [
                ['kode' => 'R-AN-01', 'nama_ruangan' => 'Ruang Periksa Anak', 'kelas' => 'Kelas 1', 'kapasitas' => 3],
            ],
            'RI-IN' => [
                ['kode' => 'R-RI-01', 'nama_ruangan' => 'Kamar 101', 'kelas' => 'Kelas 3', 'kapasitas' => 4],
                ['kode' => 'R-RI-02', 'nama_ruangan' => 'Kamar 102', 'kelas' => 'Kelas 2', 'kapasitas' => 2],
            ],
        ];

        foreach ($branches as $code => $branch) {
            // --- Unit Lokasi ---
            $unitByKode = [];
            foreach (($unitsPerBranch[$code] ?? []) as $u) {
                $unit = UnitLokasi::updateOrCreate(
                    ['branch_id' => $branch->id, 'kode' => $u['kode']],
                    array_merge($u, ['branch_id' => $branch->id, 'status' => 'aktif']),
                );
                $unitByKode[$u['kode']] = $unit;
            }

            // --- Poli ---
            $poliByKode = [];
            foreach (($polisPerBranch[$code] ?? []) as $p) {
                $unitId = $unitByKode[$p['unit']]?->id;
                $depo = DepoObat::where('branch_id', $branch->id)->where('nama_depo', $p['depo'])->first();
                $poli = Poli::updateOrCreate(
                    ['branch_id' => $branch->id, 'kode' => $p['kode']],
                    [
                        'branch_id' => $branch->id,
                        'unit_lokasi_id' => $unitId,
                        'depo_obat_id' => $depo?->id,
                        'kode' => $p['kode'],
                        'nama' => $p['nama'],
                        'jenis_poli' => $p['jenis_poli'] ?? null,
                        'antrian_ftkp' => $p['antrian_ftkp'] ?? false,
                        'status' => 'aktif',
                    ],
                );
                $poliByKode[$p['kode']] = $poli;
            }

            // --- Ruangan ---
            foreach ($poliByKode as $poliKode => $poli) {
                foreach (($ruanganPerPoli[$poliKode] ?? []) as $r) {
                    Ruangan::updateOrCreate(
                        ['poli_id' => $poli->id, 'kode' => $r['kode']],
                        array_merge($r, [
                            'branch_id' => $branch->id,
                            'poli_id' => $poli->id,
                            'status' => $r['status'] ?? 'tersedia',
                        ]),
                    );
                }
            }
        }
    }
}
