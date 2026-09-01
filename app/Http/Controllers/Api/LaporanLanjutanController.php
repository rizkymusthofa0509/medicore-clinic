<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kunjungan;
use App\Models\PemeriksaanDokter;
use App\Models\StokMutasi;
use Illuminate\Http\Request;

class LaporanLanjutanController extends Controller
{
    /**
     * GET /api/laporan/lanjutan?branch_id=&date_from=&date_to=&jenis=jasa_medis|operasional|rekapitulasi|top_diagnosa
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'jenis' => 'required|in:jasa_medis,operasional,rekapitulasi,top_diagnosa',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
        ]);

        $branchId = (int) $validated['branch_id'];
        $dateFrom = $validated['date_from'] ?? null;
        $dateTo = $validated['date_to'] ?? null;

        $kunjunganQuery = Kunjungan::with([
            'pasien:id,no_rm,nama,jenis_kelamin',
            'poli:id,kode,nama',
            'dokter:id,nama',
            'asuransi:id,nama_perusahaan',
        ])->forBranch($branchId)->where('status', '!=', 'batal');

        if ($dateFrom) $kunjunganQuery->whereDate('tgl_jam_kunjungan', '>=', $dateFrom);
        if ($dateTo) $kunjunganQuery->whereDate('tgl_jam_kunjungan', '<=', $dateTo);

        $kunjungans = $kunjunganQuery->get();

        $examsQuery = PemeriksaanDokter::with(['kunjungan:id,branch_id,no_pendaftaran,tgl_jam_kunjungan,status,poli_id,dokter_id,metode_pembayaran'])
            ->forBranch($branchId)->where('status', 'final');

        if ($dateFrom) $examsQuery->whereDate('created_at', '>=', $dateFrom);
        if ($dateTo) $examsQuery->whereDate('created_at', '<=', $dateTo);

        $exams = $examsQuery->get();

        return response()->json(['success' => true, 'data' => match ($validated['jenis']) {
            'jasa_medis' => $this->jasaMedis($kunjungans, $exams),
            'operasional' => $this->operasional($branchId, $dateFrom, $dateTo, $kunjungans),
            'rekapitulasi' => $this->rekapitulasi($kunjungans, $exams),
            'top_diagnosa' => $this->topDiagnosa($exams),
        }]);
    }

    // ==================== JASA MEDIS ====================
    private function jasaMedis($kunjungans, $exams): array
    {
        $perDokter = [];
        $perPoli = [];

        foreach ($exams as $pd) {
            $dokter = $pd->dokter?->nama ?? ($pd->kunjungan?->dokter_id ? 'Dokter #' . $pd->kunjungan->dokter_id : 'Tanpa Dokter');
            $poliNama = $pd->kunjungan?->poli_id ? ('Poli #' . $pd->kunjungan->poli_id) : 'Tanpa Poli';

            // Map poli dari kunjungan (relasi poli belum di-load di exam)
            $k = $pd->kunjungan;

            $dokterKey = mb_strtolower($dokter);
            $poliKey = mb_strtolower($poliNama);

            $tindakan = 0.0;
            foreach ($pd->pemberian_tindakan ?? [] as $r) {
                $tindakan += (float) ($r['biaya'] ?? 0) * (int) ($r['jumlah'] ?? 1);
            }

            if (! isset($perDokter[$dokterKey])) $perDokter[$dokterKey] = ['nama' => $dokter, 'jumlahKunjungan' => 0, 'tindakan' => 0.0];
            $perDokter[$dokterKey]['jumlahKunjungan']++;
            $perDokter[$dokterKey]['tindakan'] += $tindakan;

            if (! isset($perPoli[$poliKey])) $perPoli[$poliKey] = ['nama' => $poliNama, 'jumlahKunjungan' => 0, 'tindakan' => 0.0];
            $perPoli[$poliKey]['jumlahKunjungan']++;
            $perPoli[$poliKey]['tindakan'] += $tindakan;
        }

        $list = [];
        foreach ($perDokter as $d) {
            // 60% jasa dokter dari total tindakan (asumsi standar; bisa diatur)
            $list[] = [
                'dokter' => $d['nama'],
                'jumlahKunjungan' => $d['jumlahKunjungan'],
                'totalTindakan' => $d['tindakan'],
                'jasaDokter' => round($d['tindakan'] * 0.6, 2),
                'jasaKlinik' => round($d['tindakan'] * 0.4, 2),
            ];
        }
        usort($list, fn ($a, $b) => $b['jasaDokter'] <=> $a['jasaDokter']);

        return [
            'perDokter' => $list,
            'perPoli' => array_values($perPoli),
            'totalTindakan' => round(array_sum(array_column($list, 'totalTindakan')), 2),
            'totalJasaDokter' => round(array_sum(array_column($list, 'jasaDokter')), 2),
        ];
    }

    // ==================== OPERASIONAL ====================
    private function operasional(int $branchId, ?string $dateFrom, ?string $dateTo, $kunjungans): array
    {
        $mutasiQuery = StokMutasi::forBranch($branchId);
        if ($dateFrom) $mutasiQuery->whereDate('created_at', '>=', $dateFrom);
        if ($dateTo) $mutasiQuery->whereDate('created_at', '<=', $dateTo);
        $mutasis = $mutasiQuery->get();

        $nilaiObatKeluar = $mutasis->whereIn('tipe', ['dispensing', 'keluar', 'penyesuaian'])
            ->sum(fn ($m) => $m->qty * ($m->harga_satuan ?: 0));

        $kunjunganHariIni = $kunjungans->where('tgl_jam_kunjungan', '>=', now()->startOfDay())->count();
        $pasienLama = $kunjungans->where('jenis_kunjungan', 'lama')->count();
        $pasienBaru = $kunjungans->where('jenis_kunjungan', 'baru')->count();

        return [
            'jumlahKunjungan' => $kunjungans->count(),
            'kunjunganHariIni' => $kunjunganHariIni,
            'pasienBaru' => $pasienBaru,
            'pasienLama' => $pasienLama,
            'totalObatKeluar' => $mutasis->whereIn('tipe', ['dispensing', 'keluar'])->sum('qty'),
            'nilaiObatKeluar' => round($nilaiObatKeluar, 2),
            'totalMutasi' => $mutasis->count(),
            'metodeBayar' => $kunjungans->where('status', '!=', 'batal')
                ->groupBy('metode_pembayaran')
                ->map(fn ($g) => ['metode' => $g->first()->metode_pembayaran, 'jumlah' => $g->count()])
                ->values(),
        ];
    }

    // ==================== REKAPITULASI ====================
    private function rekapitulasi($kunjungans, $exams): array
    {
        $perPoli = [];
        $perHari = [];
        $perJenis = [];

        foreach ($kunjungans as $k) {
            if ($k->status === 'batal') continue;
            $poli = $k->poli?->nama ?? 'Tanpa Poli';
            $hari = $k->tgl_jam_kunjungan?->format('Y-m-d') ?? substr((string) $k->created_at, 0, 10);
            $jenis = $k->jenis_kunjungan ?: '-';

            if (! isset($perPoli[$poli])) $perPoli[$poli] = ['nama' => $poli, 'jumlah' => 0];
            $perPoli[$poli]['jumlah']++;

            if (! isset($perHari[$hari])) $perHari[$hari] = ['tanggal' => $hari, 'jumlah' => 0];
            $perHari[$hari]['jumlah']++;

            if (! isset($perJenis[$jenis])) $perJenis[$jenis] = ['jenis' => $jenis, 'jumlah' => 0];
            $perJenis[$jenis]['jumlah']++;
        }

        // Diagnosa terbanyak (dari catatan pemeriksaan)
        $diagnosaCount = [];
        foreach ($exams as $pd) {
            foreach ($pd->catatan ?? [] as $c) {
                $d = trim((string) ($c['diagnosa'] ?? ''));
                if ($d === '') continue;
                $key = mb_strtolower($d);
                $diagnosaCount[$key] = ($diagnosaCount[$key] ?? ['diagnosa' => $d, 'jumlah' => 0]);
                $diagnosaCount[$key]['jumlah']++;
            }
        }
        $topDiagnosa = array_slice(array_values($diagnosaCount), 0, 10);
        usort($topDiagnosa, fn ($a, $b) => $b['jumlah'] <=> $a['jumlah']);

        $perPoliSorted = array_values($perPoli);
        usort($perPoliSorted, fn ($a, $b) => $b['jumlah'] <=> $a['jumlah']);
        ksort($perHari);

        return [
            'perPoli' => $perPoliSorted,
            'perHari' => array_values($perHari),
            'perJenis' => array_values($perJenis),
            'topDiagnosa' => $topDiagnosa,
        ];
    }

    // ==================== TOP DIAGNOSA ====================
    private function topDiagnosa($exams): array
    {
        $count = [];
        foreach ($exams as $pd) {
            foreach ($pd->catatan ?? [] as $c) {
                $d = trim((string) ($c['diagnosa'] ?? ''));
                if ($d === '') continue;
                $key = mb_strtolower($d);
                $count[$key] = ($count[$key] ?? ['diagnosa' => $d, 'jumlah' => 0]);
                $count[$key]['jumlah']++;
            }
        }
        $list = array_values($count);
        usort($list, fn ($a, $b) => $b['jumlah'] <=> $a['jumlah']);

        return ['list' => array_slice($list, 0, 10)];
    }
}
