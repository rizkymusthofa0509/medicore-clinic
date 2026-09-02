<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\ObatAlkes;
use Illuminate\Database\Seeder;

class ObatAlkesSeeder extends Seeder
{
    /**
     * Seeder khusus branch 1 (BR-001) untuk Obat, Alkes, dan PBF.
     */
    public function run(): void
    {
        $branch = Branch::where('code', 'BR-001')->first();
        if (! $branch) {
            $this->command?->warn('Branch BR-001 tidak ditemukan, seeder dilewati.');
            return;
        }

        $rows = [
            // =================== OBAT ===================
            ['kategori' => 'obat', 'nama' => 'Paracetamol 500 mg Tab',          'kode_kfa' => '91000012', 'satuan_terbesar' => 'Box',    'satuan_terkecil' => 'Tablet', 'jumlah_per_satuan_terbesar' => 100, 'harga_jual' => 15000, 'stok' => 80],
            ['kategori' => 'obat', 'nama' => 'Paracetamol Sirup 120 mg/5 ml',   'kode_kfa' => '91000013', 'satuan_terbesar' => 'Botol',  'satuan_terkecil' => 'ml',     'jumlah_per_satuan_terbesar' => 60,  'harga_jual' => 22000, 'stok' => 45],
            ['kategori' => 'obat', 'nama' => 'Amoxicillin 500 mg Kapsul',       'kode_kfa' => '91000045', 'satuan_terbesar' => 'Box',    'satuan_terkecil' => 'Kapsul', 'jumlah_per_satuan_terbesar' => 100, 'harga_jual' => 35000, 'stok' => 60],
            ['kategori' => 'obat', 'nama' => 'Amoxicillin Sirup 250 mg/5 ml',   'kode_kfa' => '91000046', 'satuan_terbesar' => 'Botol',  'satuan_terkecil' => 'ml',     'jumlah_per_satuan_terbesar' => 60,  'harga_jual' => 28000, 'stok' => 35],
            ['kategori' => 'obat', 'nama' => 'Ibuprofen 400 mg Tab',            'kode_kfa' => '91000123', 'satuan_terbesar' => 'Box',    'satuan_terkecil' => 'Tablet', 'jumlah_per_satuan_terbesar' => 50,  'harga_jual' => 22000, 'stok' => 40],
            ['kategori' => 'obat', 'nama' => 'Cefixime 200 mg Kapsul',          'kode_kfa' => '91000234', 'satuan_terbesar' => 'Box',    'satuan_terkecil' => 'Kapsul', 'jumlah_per_satuan_terbesar' => 30,  'harga_jual' => 45000, 'stok' => 25],
            ['kategori' => 'obat', 'nama' => 'Ciprofloxacin 500 mg Tab',        'kode_kfa' => '91000256', 'satuan_terbesar' => 'Box',    'satuan_terkecil' => 'Tablet', 'jumlah_per_satuan_terbesar' => 50,  'harga_jual' => 38000, 'stok' => 30],
            ['kategori' => 'obat', 'nama' => 'Metformin 500 mg Tab',            'kode_kfa' => '91000321', 'satuan_terbesar' => 'Box',    'satuan_terkecil' => 'Tablet', 'jumlah_per_satuan_terbesar' => 100, 'harga_jual' => 25000, 'stok' => 70],
            ['kategori' => 'obat', 'nama' => 'Amlodipine 10 mg Tab',            'kode_kfa' => '91000432', 'satuan_terbesar' => 'Box',    'satuan_terkecil' => 'Tablet', 'jumlah_per_satuan_terbesar' => 100, 'harga_jual' => 30000, 'stok' => 55],
            ['kategori' => 'obat', 'nama' => 'Omeprazole 20 mg Kapsul',         'kode_kfa' => '91000567', 'satuan_terbesar' => 'Box',    'satuan_terkecil' => 'Kapsul', 'jumlah_per_satuan_terbesar' => 30,  'harga_jual' => 42000, 'stok' => 32],
            ['kategori' => 'obat', 'nama' => 'Antasida Sirup 60 ml',            'kode_kfa' => '91000654', 'satuan_terbesar' => 'Botol',  'satuan_terkecil' => 'ml',     'jumlah_per_satuan_terbesar' => 60,  'harga_jual' => 18000, 'stok' => 50],
            ['kategori' => 'obat', 'nama' => 'OBH Sirup 100 ml',                'kode_kfa' => null,        'satuan_terbesar' => 'Botol',  'satuan_terkecil' => 'ml',     'jumlah_per_satuan_terbesar' => 100, 'harga_jual' => 28000, 'stok' => 40],
            ['kategori' => 'obat', 'nama' => 'CTM 4 mg Tab',                    'kode_kfa' => '91000789', 'satuan_terbesar' => 'Box',    'satuan_terkecil' => 'Tablet', 'jumlah_per_satuan_terbesar' => 100, 'harga_jual' => 12000, 'stok' => 90],
            ['kategori' => 'obat', 'nama' => 'Salbutamol 4 mg Tab',             'kode_kfa' => '91000890', 'satuan_terbesar' => 'Box',    'satuan_terkecil' => 'Tablet', 'jumlah_per_satuan_terbesar' => 100, 'harga_jual' => 16000, 'stok' => 45],
            ['kategori' => 'obat', 'nama' => 'Salbutamol Inhaler 100 mcg',      'kode_kfa' => '91000891', 'satuan_terbesar' => 'Pcs',    'satuan_terkecil' => 'Pcs',    'jumlah_per_satuan_terbesar' => 1,   'harga_jual' => 85000, 'stok' => 20],

            // =================== ALKES ===================
            ['kategori' => 'alkes', 'nama' => 'Masker Bedah 3 Ply',             'kode_kfa' => '93000010', 'satuan_terbesar' => 'Box',    'satuan_terkecil' => 'Pcs',   'jumlah_per_satuan_terbesar' => 50,   'harga_jual' => 35000,  'stok' => 120],
            ['kategori' => 'alkes', 'nama' => 'Masker N95',                     'kode_kfa' => '93000011', 'satuan_terbesar' => 'Pcs',    'satuan_terkecil' => 'Pcs',   'jumlah_per_satuan_terbesar' => 1,    'harga_jual' => 25000,  'stok' => 80],
            ['kategori' => 'alkes', 'nama' => 'Sarung Tangan Latex S',          'kode_kfa' => '93000020', 'satuan_terbesar' => 'Box',    'satuan_terkecil' => 'Pcs',   'jumlah_per_satuan_terbesar' => 100,  'harga_jual' => 75000,  'stok' => 60],
            ['kategori' => 'alkes', 'nama' => 'Sarung Tangan Latex M',          'kode_kfa' => '93000021', 'satuan_terbesar' => 'Box',    'satuan_terkecil' => 'Pcs',   'jumlah_per_satuan_terbesar' => 100,  'harga_jual' => 75000,  'stok' => 70],
            ['kategori' => 'alkes', 'nama' => 'Sarung Tangan Latex L',          'kode_kfa' => '93000022', 'satuan_terbesar' => 'Box',    'satuan_terkecil' => 'Pcs',   'jumlah_per_satuan_terbesar' => 100,  'harga_jual' => 75000,  'stok' => 55],
            ['kategori' => 'alkes', 'nama' => 'Spuit 1 ml',                     'kode_kfa' => '93000030', 'satuan_terbesar' => 'Box',    'satuan_terkecil' => 'Pcs',   'jumlah_per_satuan_terbesar' => 100,  'harga_jual' => 55000,  'stok' => 40],
            ['kategori' => 'alkes', 'nama' => 'Spuit 3 ml',                     'kode_kfa' => '93000031', 'satuan_terbesar' => 'Box',    'satuan_terkecil' => 'Pcs',   'jumlah_per_satuan_terbesar' => 100,  'harga_jual' => 65000,  'stok' => 50],
            ['kategori' => 'alkes', 'nama' => 'Spuit 5 ml',                     'kode_kfa' => '93000032', 'satuan_terbesar' => 'Box',    'satuan_terkecil' => 'Pcs',   'jumlah_per_satuan_terbesar' => 100,  'harga_jual' => 70000,  'stok' => 45],
            ['kategori' => 'alkes', 'nama' => 'Spuit 10 ml',                    'kode_kfa' => '93000033', 'satuan_terbesar' => 'Box',    'satuan_terkecil' => 'Pcs',   'jumlah_per_satuan_terbesar' => 100,  'harga_jual' => 85000,  'stok' => 30],
            ['kategori' => 'alkes', 'nama' => 'Infus Set Dewasa',               'kode_kfa' => '93000045', 'satuan_terbesar' => 'Pcs',    'satuan_terkecil' => 'Pcs',   'jumlah_per_satuan_terbesar' => 1,    'harga_jual' => 18000,  'stok' => 80],
            ['kategori' => 'alkes', 'nama' => 'Infus Set Anak',                 'kode_kfa' => '93000046', 'satuan_terbesar' => 'Pcs',    'satuan_terkecil' => 'Pcs',   'jumlah_per_satuan_terbesar' => 1,    'harga_jual' => 20000,  'stok' => 40],
            ['kategori' => 'alkes', 'nama' => 'Plester Hipoalergenik 5 cm',     'kode_kfa' => null,        'satuan_terbesar' => 'Roll',   'satuan_terkecil' => 'Cm',    'jumlah_per_satuan_terbesar' => 500,  'harga_jual' => 25000,  'stok' => 35],
            ['kategori' => 'alkes', 'nama' => 'Kassa Steril 5x5 cm',            'kode_kfa' => '93000050', 'satuan_terbesar' => 'Box',    'satuan_terkecil' => 'Pcs',   'jumlah_per_satuan_terbesar' => 100,  'harga_jual' => 45000,  'stok' => 25],
            ['kategori' => 'alkes', 'nama' => 'Alkohol Swab 70%',               'kode_kfa' => null,        'satuan_terbesar' => 'Box',    'satuan_terkecil' => 'Pcs',   'jumlah_per_satuan_terbesar' => 100,  'harga_jual' => 25000,  'stok' => 50],
            ['kategori' => 'alkes', 'nama' => 'Alkohol 70% 1 Liter',            'kode_kfa' => '93000060', 'satuan_terbesar' => 'Botol',  'satuan_terkecil' => 'ml',    'jumlah_per_satuan_terbesar' => 1000, 'harga_jual' => 35000,  'stok' => 20],
            ['kategori' => 'alkes', 'nama' => 'Handscoon Non Steril S',         'kode_kfa' => '93000070', 'satuan_terbesar' => 'Box',    'satuan_terkecil' => 'Pcs',   'jumlah_per_satuan_terbesar' => 100,  'harga_jual' => 60000,  'stok' => 50],
            ['kategori' => 'alkes', 'nama' => 'Termometer Digital',             'kode_kfa' => '93000080', 'satuan_terbesar' => 'Pcs',    'satuan_terkecil' => 'Pcs',   'jumlah_per_satuan_terbesar' => 1,    'harga_jual' => 45000,  'stok' => 15],
            ['kategori' => 'alkes', 'nama' => 'Tensimeter Digital',             'kode_kfa' => '93000081', 'satuan_terbesar' => 'Pcs',    'satuan_terkecil' => 'Pcs',   'jumlah_per_satuan_terbesar' => 1,    'harga_jual' => 350000, 'stok' => 5],
            ['kategori' => 'alkes', 'nama' => 'Stetoskop',                      'kode_kfa' => '93000082', 'satuan_terbesar' => 'Pcs',    'satuan_terkecil' => 'Pcs',   'jumlah_per_satuan_terbesar' => 1,    'harga_jual' => 250000, 'stok' => 8],
            ['kategori' => 'alkes', 'nama' => 'Pulse Oximeter',                 'kode_kfa' => '93000083', 'satuan_terbesar' => 'Pcs',    'satuan_terkecil' => 'Pcs',   'jumlah_per_satuan_terbesar' => 1,    'harga_jual' => 175000, 'stok' => 10],

            // =================== PBF ===================
            ['kategori' => 'pbf', 'nama' => 'PT Kimia Farma Trading & Distribution',     'alamat' => 'Jl. Veteran No. 9, Jakarta Pusat',         'no_telp' => '021-3811111', 'email' => 'order@kftd.co.id'],
            ['kategori' => 'pbf', 'nama' => 'PT Enseval Putera Megatrading',              'alamat' => 'Jl. Pulo Lentut No. 10, Jakarta Timur',     'no_telp' => '021-4602483', 'email' => 'info@enseval.com'],
            ['kategori' => 'pbf', 'nama' => 'PT Anugrah Argon Medica',                   'alamat' => 'Jl. Raya Bekasi Km. 27, Jakarta Utara',     'no_telp' => '021-4403111', 'email' => 'sales@aam.co.id'],
            ['kategori' => 'pbf', 'nama' => 'PT Bina San Prima',                          'alamat' => 'Jl. Kelapa Gading Boulevard, Jakarta Utara', 'no_telp' => '021-4533322', 'email' => 'order@binasanprima.com'],
            ['kategori' => 'pbf', 'nama' => 'PT Surya Fajar Indonesia',                  'alamat' => 'Jl. Gatot Subroto Kav. 27, Jakarta Selatan',  'no_telp' => '021-5210000', 'email' => null],
            ['kategori' => 'pbf', 'nama' => 'PT Mensa Binasukses',                        'alamat' => 'Jl. Raya Narogong Km. 12, Bekasi',           'no_telp' => '021-8250456', 'email' => 'info@mensa.co.id'],
            ['kategori' => 'pbf', 'nama' => 'PT Sapta Sari Tama',                         'alamat' => 'Jl. Rawa Gelam III No. 8, Jakarta Timur',     'no_telp' => '021-4601050', 'email' => null],
            ['kategori' => 'pbf', 'nama' => 'PT Dharma Patria Daya',                      'alamat' => 'Jl. Pangeran Jayakarta 117, Jakarta Pusat',   'no_telp' => '021-6290700', 'email' => 'sales@dharmapatria.co.id'],
        ];

        $count = 0;
        $skipped = 0;
        foreach ($rows as $row) {
            $row['branch_id'] = $branch->id;
            $row['status'] = 'aktif';
            $row['harga_jual'] = $row['harga_jual'] ?? 0;
            $row['stok'] = $row['stok'] ?? 0;

            // Jika nama sudah ada di branch ini, pertahankan data operasional
            // yang mungkin telah disunting pengguna.
            $existing = ObatAlkes::where('branch_id', $branch->id)
                ->where('kategori', $row['kategori'])
                ->where('nama', $row['nama'])
                ->first();

            if ($existing) {
                $skipped++;
                continue;
            }

            // Jika kode_kfa sudah dipakai row lain di branch ini, kosongkan (unique constraint)
            if (!empty($row['kode_kfa'])) {
                $dupKfa = ObatAlkes::where('branch_id', $branch->id)
                    ->where('kode_kfa', $row['kode_kfa'])
                    ->exists();
                if ($dupKfa) {
                    $row['kode_kfa'] = null;
                }
            }

            try {
                ObatAlkes::create($row);
                $count++;
            } catch (\Throwable $e) {
                $skipped++;
            }
        }

        $byKategori = collect($rows)->groupBy('kategori')->map->count();
        $this->command?->info(sprintf(
            'ObatAlkesSeeder: %d data untuk branch %s (Obat=%d, Alkes=%d, PBF=%d, dilewati=%d).',
            $count,
            $branch->code,
            $byKategori['obat'] ?? 0,
            $byKategori['alkes'] ?? 0,
            $byKategori['pbf'] ?? 0,
            $skipped,
        ));
    }
}
