<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Nakes;
use App\Models\Poli;
use Illuminate\Database\Seeder;

class NakesSeeder extends Seeder
{
    public function run(): void
    {
        $perBranch = [
            'BR-001' => [
                [
                    'nama' => 'dr. Andi Pratama, Sp.PD', 'nik' => '3175012345670001',
                    'email' => 'andi.pratama@medicore.test', 'tipe' => 'dokter',
                    'no_str' => 'STR-DR-001', 'no_sip' => 'SIP-DR-001',
                    'str_expired_at' => '2027-06-30', 'sip_expired_at' => '2027-06-30',
                    'kode_bpjs' => 'BPJS-DR-001', 'ihs_satusehat' => 'IHS-1000001',
                    'spesialisasi' => 'Penyakit Dalam', 'no_telp' => '081234567001',
                    'poli_codes' => ['PL-UM'],
                ],
                [
                    'nama' => 'dr. Budi Santoso, Sp.KG', 'nik' => '3175012345670002',
                    'email' => 'budi.santoso@medicore.test', 'tipe' => 'dokter',
                    'no_str' => 'STR-DR-002', 'no_sip' => 'SIP-DR-002',
                    'str_expired_at' => '2026-12-31', 'sip_expired_at' => '2026-12-31',
                    'kode_bpjs' => null, 'ihs_satusehat' => 'IHS-1000002',
                    'spesialisasi' => 'Kedokteran Gigi', 'no_telp' => '081234567002',
                    'poli_codes' => ['PL-GI'],
                ],
                [
                    'nama' => 'dr. Citra Lestari, Sp.A', 'nik' => '3175012345670003',
                    'email' => 'citra.lestari@medicore.test', 'tipe' => 'dokter',
                    'no_str' => 'STR-DR-003', 'no_sip' => 'SIP-DR-003',
                    'str_expired_at' => '2028-03-15', 'sip_expired_at' => '2028-03-15',
                    'kode_bpjs' => 'BPJS-DR-003', 'ihs_satusehat' => 'IHS-1000003',
                    'spesialisasi' => 'Anak', 'no_telp' => '081234567003',
                    'poli_codes' => ['PL-AN'],
                ],
                [
                    'nama' => 'Ns. Dewi Anggraini, S.Kep', 'nik' => '3175012345670011',
                    'email' => 'dewi.anggraini@medicore.test', 'tipe' => 'perawat',
                    'no_str' => 'STR-PW-001',
                    'str_expired_at' => '2027-08-20', 'sip_expired_at' => null,
                    'kode_bpjs' => null, 'ihs_satusehat' => 'IHS-2000001',
                    'spesialisasi' => null, 'no_telp' => '081234567011',
                    'poli_codes' => ['PL-UM', 'PL-AN'],
                ],
                [
                    'nama' => 'Ns. Eko Wibowo, S.Kep', 'nik' => '3175012345670012',
                    'email' => 'eko.wibowo@medicore.test', 'tipe' => 'perawat',
                    'no_str' => 'STR-PW-002',
                    'str_expired_at' => '2026-11-10', 'sip_expired_at' => null,
                    'kode_bpjs' => null, 'ihs_satusehat' => null,
                    'spesialisasi' => null, 'no_telp' => '081234567012',
                    'poli_codes' => ['RI-IN'],
                ],
                [
                    'nama' => 'Bd. Fitri Handayani, S.ST', 'nik' => '3175012345670021',
                    'email' => 'fitri.handayani@medicore.test', 'tipe' => 'bidan',
                    'no_str' => 'STR-BD-001',
                    'str_expired_at' => '2027-04-25', 'sip_expired_at' => '2027-04-25',
                    'kode_bpjs' => 'BPJS-BD-001', 'ihs_satusehat' => 'IHS-3000001',
                    'spesialisasi' => 'Kebidanan', 'no_telp' => '081234567021',
                    'poli_codes' => ['PL-UM'],
                ],
                [
                    'nama' => 'Bd. Gita Permata, S.ST', 'nik' => '3175012345670022',
                    'email' => 'gita.permata@medicore.test', 'tipe' => 'bidan',
                    'no_str' => 'STR-BD-002',
                    'str_expired_at' => '2028-01-12', 'sip_expired_at' => '2028-01-12',
                    'kode_bpjs' => null, 'ihs_satusehat' => null,
                    'spesialisasi' => 'Kebidanan', 'no_telp' => '081234567022',
                    'poli_codes' => ['PL-AN'],
                ],
                [
                    'nama' => 'Ahmad Fauzi, S.Tr.Kes', 'nik' => '3175012345670031',
                    'email' => 'ahmad.fauzi@medicore.test', 'tipe' => 'analis_lab',
                    'no_str' => 'STR-AL-001',
                    'str_expired_at' => '2027-09-05', 'sip_expired_at' => null,
                    'kode_bpjs' => null, 'ihs_satusehat' => 'IHS-4000001',
                    'spesialisasi' => 'Analis Kesehatan', 'no_telp' => '081234567031',
                    'poli_codes' => [],
                ],
            ],
            'BR-002' => [
                [
                    'nama' => 'dr. Hadi Wijaya, Sp.PD', 'nik' => '3175022345670001',
                    'email' => 'hadi.wijaya@medicore.test', 'tipe' => 'dokter',
                    'no_str' => 'STR-DR-101', 'no_sip' => 'SIP-DR-101',
                    'str_expired_at' => '2027-07-01', 'sip_expired_at' => '2027-07-01',
                    'kode_bpjs' => 'BPJS-DR-101', 'ihs_satusehat' => 'IHS-1100001',
                    'spesialisasi' => 'Penyakit Dalam', 'no_telp' => '081235567001',
                    'poli_codes' => ['PL-UM'],
                ],
                [
                    'nama' => 'dr. Indah Sari, Sp.KG', 'nik' => '3175022345670002',
                    'email' => 'indah.sari@medicore.test', 'tipe' => 'dokter',
                    'no_str' => 'STR-DR-102', 'no_sip' => 'SIP-DR-102',
                    'str_expired_at' => '2026-10-31', 'sip_expired_at' => '2026-10-31',
                    'kode_bpjs' => null, 'ihs_satusehat' => null,
                    'spesialisasi' => 'Kedokteran Gigi', 'no_telp' => '081235567002',
                    'poli_codes' => ['PL-GI'],
                ],
                [
                    'nama' => 'Ns. Joko Susanto, S.Kep', 'nik' => '3175022345670011',
                    'email' => 'joko.susanto@medicore.test', 'tipe' => 'perawat',
                    'no_str' => 'STR-PW-101',
                    'str_expired_at' => '2027-05-18', 'sip_expired_at' => null,
                    'kode_bpjs' => null, 'ihs_satusehat' => 'IHS-2100001',
                    'spesialisasi' => null, 'no_telp' => '081235567011',
                    'poli_codes' => ['PL-UM', 'PL-GI'],
                ],
                [
                    'nama' => 'Bd. Kartika Putri, S.ST', 'nik' => '3175022345670021',
                    'email' => 'kartika.putri@medicore.test', 'tipe' => 'bidan',
                    'no_str' => 'STR-BD-101',
                    'str_expired_at' => '2028-02-28', 'sip_expired_at' => '2028-02-28',
                    'kode_bpjs' => 'BPJS-BD-101', 'ihs_satusehat' => null,
                    'spesialisasi' => 'Kebidanan', 'no_telp' => '081235567021',
                    'poli_codes' => ['PL-UM'],
                ],
            ],
        ];

        foreach ($perBranch as $branchCode => $items) {
            $branch = Branch::where('code', $branchCode)->first();
            if (! $branch) continue;

            foreach ($items as $row) {
                $poliIds = [];
                foreach (($row['poli_codes'] ?? []) as $kode) {
                    $pid = Poli::where('branch_id', $branch->id)
                        ->where('kode', $kode)->value('id');
                    if ($pid) $poliIds[] = $pid;
                }

                $payload = collect($row)->except('poli_codes')->toArray();
                $payload['branch_id'] = $branch->id;
                $payload['status'] = 'aktif';

                $nakes = Nakes::firstOrCreate(
                    ['branch_id' => $branch->id, 'nik' => $row['nik']],
                    $payload,
                );

                // Jangan menimpa konfigurasi poli milik nakes yang sudah ada.
                if ($nakes->wasRecentlyCreated) {
                    $nakes->polis()->sync($poliIds);
                }
            }
        }
    }
}
