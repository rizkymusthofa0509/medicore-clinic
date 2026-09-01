<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kunjungan;
use App\Models\PemeriksaanDokter;
use Illuminate\Http\Request;

class PendapatanController extends Controller
{
    /**
     * GET /api/laporan/pendapatan?branch_id=&date_from=&date_to=
     * Laporan pendapatan komprehensif per branch (ringkasan, transaksi,
     * pendapatan per poli, pembayaran harian, obat & tindakan terlaris).
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
        ]);

        $branchId = (int) $validated['branch_id'];
        $dateFrom = $validated['date_from'] ?? null;
        $dateTo = $validated['date_to'] ?? null;

        // --- Kunjungan dalam rentang (kecuali batal) ---
        $kunjunganQuery = Kunjungan::with([
            'pasien:id,no_rm,nama,jenis_kelamin',
            'poli:id,kode,nama',
            'dokter:id,nama',
            'asuransi:id,nama_perusahaan',
        ])
            ->forBranch($branchId)
            ->where('status', '!=', 'batal')
            ->orderByDesc('tgl_jam_kunjungan');

        if ($dateFrom) $kunjunganQuery->whereDate('tgl_jam_kunjungan', '>=', $dateFrom);
        if ($dateTo) $kunjunganQuery->whereDate('tgl_jam_kunjungan', '<=', $dateTo);

        $kunjungans = $kunjunganQuery->get();

        // --- Pemeriksaan dokter final dalam rentang yang sama ---
        $examsQuery = PemeriksaanDokter::with([
            'kunjungan:id,no_pendaftaran,tgl_jam_kunjungan,status,metode_pembayaran,poli_id,dokter_id',
        ])
            ->forBranch($branchId)
            ->where('status', 'final');

        if ($dateFrom) $examsQuery->whereDate('created_at', '>=', $dateFrom);
        if ($dateTo) $examsQuery->whereDate('created_at', '<=', $dateTo);

        $exams = $examsQuery->get();

        // --- Total pemeriksaan (obat + tindakan) per kunjungan ---
        $examTotals = [];
        $examDetail = [];
        $obatAgg = [];
        $tindakanAgg = [];
        // Normalisasi { rows: [...] } → array langsung
        $rows = fn ($v) => is_array($v) && array_key_exists('rows', $v) ? ($v['rows'] ?? []) : ($v ?? []);

        foreach ($exams as $exam) {
            $kid = $exam->kunjungan_id;
            $obatTotal = 0;
            $tindakanTotal = 0;
            $obatItems = [];
            $tindakanItems = [];
            $racikItems = [];

            foreach ($rows($exam->pemberian_obat) as $row) {
                $harga = (float) ($row['harga'] ?? 0);
                $jumlah = (int) ($row['jumlah'] ?? 0);
                $nilai = $harga * $jumlah;
                $obatTotal += $nilai;
                $nama = trim((string) ($row['namaObat'] ?? 'Obat tanpa nama'));
                if ($nilai > 0 || $jumlah > 0) {
                    $obatItems[] = [
                        'nama' => $nama,
                        'jumlah' => $jumlah,
                        'harga' => $harga,
                        'nilai' => $nilai,
                    ];
                    if ($nama !== '') {
                        $key = mb_strtolower($nama);
                        $obatAgg[$key] = ($obatAgg[$key] ?? ['nama' => $nama, 'jumlah' => 0, 'nilai' => 0]);
                        $obatAgg[$key]['jumlah'] += $jumlah;
                        $obatAgg[$key]['nilai'] += $nilai;
                    }
                }
            }

            foreach ($rows($exam->pemberian_tindakan) as $row) {
                $biaya = (float) ($row['biaya'] ?? 0);
                $jumlah = (int) ($row['jumlah'] ?? 0);
                $nilai = $biaya * $jumlah;
                $tindakanTotal += $nilai;
                $nama = trim((string) ($row['namaTindakan'] ?? 'Tindakan tanpa nama'));
                if ($nilai > 0 || $jumlah > 0) {
                    $tindakanItems[] = [
                        'nama' => $nama,
                        'jumlah' => $jumlah,
                        'biaya' => $biaya,
                        'nilai' => $nilai,
                        'dokter' => $row['dokter'] ?? null,
                        'asistenDokter' => $row['asistenDokter'] ?? null,
                    ];
                    if ($nama !== '') {
                        $key = mb_strtolower($nama);
                        $tindakanAgg[$key] = ($tindakanAgg[$key] ?? ['nama' => $nama, 'jumlah' => 0, 'nilai' => 0]);
                        $tindakanAgg[$key]['jumlah'] += $jumlah;
                        $tindakanAgg[$key]['nilai'] += $nilai;
                    }
                }
            }

            foreach ($rows($exam->pemberian_obat_racik) as $row) {
                $racikItems[] = [
                    'jumlahKemasan' => (int) ($row['jumlahKemasan'] ?? 0),
                    'aturanPakai' => $row['aturanPakai'] ?? '-',
                    'detail' => $row['detail'] ?? '-',
                ];
            }

            $examTotals[$kid] = [
                'obat' => $obatTotal,
                'tindakan' => $tindakanTotal,
                'total' => $obatTotal + $tindakanTotal,
            ];
            $examDetail[$kid] = ['obat' => $obatItems, 'tindakan' => $tindakanItems, 'racik' => $racikItems];
        }

        // --- Ringkasan ---
        $summary = ['pendaftaran' => 0.0, 'tindakan' => 0.0, 'obat' => 0.0, 'total' => 0.0, 'jumlahTransaksi' => 0];
        $perMetode = [];
        $perPoli = [];
        $perHarian = [];
        $transaksi = [];

        foreach ($kunjungans as $k) {
            $pendaftaran = (float) $k->biaya_pendaftaran;
            $exam = $examTotals[$k->id] ?? ['obat' => 0.0, 'tindakan' => 0.0, 'total' => 0.0];
            $total = $pendaftaran + $exam['total'];
            if ($total <= 0) continue; // hanya transaksi bernilai

            $metode = strtolower((string) ($k->metode_pembayaran ?: 'tunai'));
            $tanggal = $k->tgl_jam_kunjungan?->format('Y-m-d') ?? substr((string) $k->created_at, 0, 10);
            $poliNama = $k->poli?->nama ?? 'Tanpa Poli';
            $poliKey = mb_strtolower($poliNama);

            $summary['pendaftaran'] += $pendaftaran;
            $summary['tindakan'] += $exam['tindakan'];
            $summary['obat'] += $exam['obat'];
            $summary['total'] += $total;
            $summary['jumlahTransaksi']++;

            // Per metode pembayaran
            if (! isset($perMetode[$metode])) {
                $perMetode[$metode] = ['metode' => $metode, 'jumlahTransaksi' => 0, 'total' => 0.0];
            }
            $perMetode[$metode]['jumlahTransaksi']++;
            $perMetode[$metode]['total'] += $total;

            // Per poli
            if (! isset($perPoli[$poliKey])) {
                $perPoli[$poliKey] = ['poli' => $poliNama, 'jumlahKunjungan' => 0, 'pendaftaran' => 0.0, 'tindakan' => 0.0, 'obat' => 0.0, 'total' => 0.0];
            }
            $perPoli[$poliKey]['jumlahKunjungan']++;
            $perPoli[$poliKey]['pendaftaran'] += $pendaftaran;
            $perPoli[$poliKey]['tindakan'] += $exam['tindakan'];
            $perPoli[$poliKey]['obat'] += $exam['obat'];
            $perPoli[$poliKey]['total'] += $total;

            // Per hari
            if (! isset($perHarian[$tanggal])) {
                $perHarian[$tanggal] = ['tanggal' => $tanggal, 'jumlahTransaksi' => 0, 'tunai' => 0.0, 'transfer' => 0.0, 'qris' => 0.0, 'asuransi' => 0.0, 'bpjs' => 0.0, 'total' => 0.0];
            }
            $perHarian[$tanggal]['jumlahTransaksi']++;
            if (array_key_exists($metode, ['tunai' => 1, 'transfer' => 1, 'qris' => 1, 'asuransi' => 1, 'bpjs' => 1])) {
                $perHarian[$tanggal][$metode] += $total;
            }
            $perHarian[$tanggal]['total'] += $total;

            // Transaksi
            $transaksi[] = [
                'noPendaftaran' => $k->no_pendaftaran,
                'tanggal' => $k->tgl_jam_kunjungan?->format('Y-m-d H:i:s') ?? $k->created_at?->toIso8601String(),
                'tipeKunjungan' => $k->tipe_kunjungan,
                'status' => $k->status,
                'pasien' => $k->pasien ? ['id' => $k->pasien->id, 'noRm' => $k->pasien->no_rm, 'nama' => $k->pasien->nama] : null,
                'poli' => $k->poli ? ['id' => $k->poli->id, 'kode' => $k->poli->kode, 'nama' => $k->poli->nama] : null,
                'dokter' => $k->dokter ? ['id' => $k->dokter->id, 'nama' => $k->dokter->nama] : null,
                'asuransi' => $k->asuransi ? ['id' => $k->asuransi->id, 'namaPerusahaan' => $k->asuransi->nama_perusahaan] : null,
                'pendaftaran' => $pendaftaran,
                'tindakan' => $exam['tindakan'],
                'obat' => $exam['obat'],
                'total' => $total,
                'metodePembayaran' => $k->metode_pembayaran,
                'rincian' => $examDetail[$k->id] ?? ['obat' => [], 'tindakan' => [], 'racik' => []],
            ];
        }

        // Sorting
        ksort($perHarian);
        usort($perPoli, fn ($a, $b) => $b['total'] <=> $a['total']);
        usort($perMetode, fn ($a, $b) => $b['total'] <=> $a['total']);
        $obatTerlaris = array_values($obatAgg);
        usort($obatTerlaris, fn ($a, $b) => $b['nilai'] <=> $a['nilai']);
        $tindakanTerlaris = array_values($tindakanAgg);
        usort($tindakanTerlaris, fn ($a, $b) => $b['nilai'] <=> $a['nilai']);

        return response()->json([
            'success' => true,
            'data' => [
                'periode' => [
                    'branch_id' => $branchId,
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                ],
                'ringkasan' => $summary,
                'perMetode' => array_values($perMetode),
                'pendapatanPerPoli' => array_values($perPoli),
                'pembayaranHarian' => array_values($perHarian),
                'obatTerlaris' => array_slice($obatTerlaris, 0, 20),
                'tindakanTerlaris' => array_slice($tindakanTerlaris, 0, 20),
                'transaksi' => $transaksi,
            ],
        ]);
    }
}
