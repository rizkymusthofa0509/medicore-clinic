<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kunjungan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class KasirController extends Controller
{
    /**
     * Hitung tagihan sekunjungan dari biaya pendaftaran + obat/tindakan
     * pemberian pada pemeriksaan dokter berstatus final.
     */
    private function computeBill(?Kunjungan $k): array
    {
        $pendaftaran = (float) ($k->biaya_pendaftaran ?? 0);
        $obat = 0.0;
        $tindakan = 0.0;
        $obatItems = [];
        $tindakanItems = [];
        $racikItems = [];

        // Normalisasi { rows: [...] } → array langsung
        $rows = fn ($v) => is_array($v) && array_key_exists('rows', $v) ? ($v['rows'] ?? []) : ($v ?? []);

        $pd = $k?->relationLoaded('pemeriksaanDokter') ? $k->pemeriksaanDokter : null;
        if ($pd && ($pd->status ?? null) === 'final') {
            foreach ($rows($pd->pemberian_obat) as $r) {
                $harga = (float) ($r['harga'] ?? 0);
                $jumlah = (int) ($r['jumlah'] ?? 0);
                $nilai = $harga * $jumlah;
                $obat += $nilai;
                $obatItems[] = ['nama' => trim((string) ($r['namaObat'] ?? 'Obat')), 'satuan' => $r['satuan'] ?? '-', 'jumlah' => $jumlah, 'harga' => $harga, 'nilai' => $nilai, 'dokter' => $r['dokter'] ?? null];
            }
            foreach ($pd->pemberian_obat_racik ?? [] as $r) {
                $racikItems[] = ['jumlahKemasan' => (int) ($r['jumlahKemasan'] ?? 0), 'aturanPakai' => $r['aturanPakai'] ?? '-', 'detail' => $r['detail'] ?? '-'];
            }
            foreach ($rows($pd->pemberian_tindakan) as $r) {
                $biaya = (float) ($r['biaya'] ?? 0);
                $jumlah = (int) ($r['jumlah'] ?? 0);
                $nilai = $biaya * $jumlah;
                $tindakan += $nilai;
                $tindakanItems[] = ['nama' => trim((string) ($r['namaTindakan'] ?? 'Tindakan')), 'jumlah' => $jumlah, 'biaya' => $biaya, 'nilai' => $nilai, 'dokter' => $r['dokter'] ?? null, 'asistenDokter' => $r['asistenDokter'] ?? null];
            }
        }

        return [
            'pendaftaran' => $pendaftaran,
            'obat' => $obat,
            'tindakan' => $tindakan,
            'total' => $pendaftaran + $obat + $tindakan,
            'items' => ['obat' => $obatItems, 'tindakan' => $tindakanItems, 'racik' => $racikItems],
        ];
    }

    /**
     * GET /api/kasir/tagihan
     * Query: branch_id (required), status(belum_bayar|lunas), date_from, date_to, q, limit
     */
    public function tagihan(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'status' => 'nullable|in:belum_bayar,lunas,persetujuan',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'q' => 'nullable|string|max:200',
            'limit' => 'nullable|integer|min:1|max:500',
        ]);

        $branchId = (int) $validated['branch_id'];
        $status = $validated['status'] ?? 'belum_bayar';

        $query = Kunjungan::with([
            'pasien:id,no_rm,nama',
            'poli:id,nama',
            'dokter:id,nama',
            'pemeriksaanDokter',
            'kasir:id,name',
        ])
            ->forBranch($branchId)
            ->whereIn('status', ['selesai', 'diperiksa']);

        if ($status === 'lunas') {
            $query->where('status_bayar', 'lunas');
        } else {
            $query->whereIn('status_bayar', ['belum_bayar', 'persetujuan']);
        }

        if (! empty($validated['date_from'])) $query->whereDate('tgl_jam_kunjungan', '>=', $validated['date_from']);
        if (! empty($validated['date_to'])) $query->whereDate('tgl_jam_kunjungan', '<=', $validated['date_to']);

        if (! empty($validated['q'])) {
            $needle = '%' . $validated['q'] . '%';
            $query->where(function ($w) use ($needle) {
                $w->where('no_pendaftaran', 'like', $needle)
                    ->orWhereHas('pasien', fn ($p) => $p->where('no_rm', 'like', $needle)->orWhere('nama', 'like', $needle));
            });
        }

        $rows = $query->orderByDesc('tgl_jam_kunjungan')
            ->limit($validated['limit'] ?? 200)
            ->get()
            ->map(function (Kunjungan $k) {
                $bill = $this->computeBill($k);
                return [
                    'id' => $k->id,
                    'noPendaftaran' => $k->no_pendaftaran,
                    'tanggal' => $k->tgl_jam_kunjungan?->format('Y-m-d H:i:s'),
                    'status' => $k->status,
                    'statusBayar' => $k->status_bayar ?? 'belum_bayar',
                    'metodePembayaran' => $k->metode_pembayaran,
                    'pasien' => $k->pasien ? ['id' => $k->pasien->id, 'noRm' => $k->pasien->no_rm, 'nama' => $k->pasien->nama] : null,
                    'poli' => $k->poli ? ['nama' => $k->poli->nama] : null,
                    'dokter' => $k->dokter ? ['nama' => $k->dokter->nama] : null,
                    'jumlahDibayarkan' => (float) $k->jumlah_dibayarkan,
                    'kasirNama' => $k->kasir?->name,
                    'tanggalBayar' => $k->tanggal_bayar?->format('Y-m-d H:i:s'),
                    'rincian' => $bill,
                    'totalTagihan' => $bill['total'],
                    'utang' => $bill['total'] - (float) $k->jumlah_dibayarkan,
                ];
            });

        return response()->json(['success' => true, 'data' => $rows]);
    }

    /**
     * GET /api/kasir/tagihan/{id}
     */
    public function detail(Request $request, $id)
    {
        $validated = $request->validate(['branch_id' => 'required|integer|exists:branches,id']);

        $k = Kunjungan::with([
            'pasien:id,no_rm,nama,jenis_kelamin,tanggal_lahir',
            'poli:id,kode,nama',
            'dokter:id,nama',
            'asuransi:id,nama_perusahaan',
            'pemeriksaanDokter',
            'kasir:id,name',
            'creator:id,name',
        ])
            ->forBranch((int) $validated['branch_id'])
            ->findOrFail($id);

        $bill = $this->computeBill($k);

        return response()->json(['success' => true, 'data' => [
            'id' => $k->id,
            'noPendaftaran' => $k->no_pendaftaran,
            'tanggal' => $k->tgl_jam_kunjungan?->format('Y-m-d H:i:s'),
            'tipeKunjungan' => $k->tipe_kunjungan,
            'jenisKunjungan' => $k->jenis_kunjungan,
            'status' => $k->status,
            'statusBayar' => $k->status_bayar ?? 'belum_bayar',
            'metodePembayaran' => $k->metode_pembayaran,
            'statusPrioritas' => $k->status_prioritas,
            'biayaPendaftaran' => (float) $k->biaya_pendaftaran,
            'jumlahDibayarkan' => (float) $k->jumlah_dibayarkan,
            'tanggalBayar' => $k->tanggal_bayar?->format('Y-m-d H:i:s'),
            'catatanBayar' => $k->catatan_bayar,
            'kasirNama' => $k->kasir?->name,
            'dibuatOleh' => $k->creator?->name,
            'pasien' => $k->pasien ? [
                'id' => $k->pasien->id, 'noRm' => $k->pasien->no_rm,
                'nama' => $k->pasien->nama, 'jenisKelamin' => $k->pasien->jenis_kelamin,
                'tanggalLahir' => $k->pasien->tanggal_lahir?->format('Y-m-d'),
            ] : null,
            'poli' => $k->poli ? ['id' => $k->poli->id, 'kode' => $k->poli->kode, 'nama' => $k->poli->nama] : null,
            'dokter' => $k->dokter ? ['id' => $k->dokter->id, 'nama' => $k->dokter->nama] : null,
            'asuransi' => $k->asuransi ? ['id' => $k->asuransi->id, 'namaPerusahaan' => $k->asuransi->nama_perusahaan, 'noAsuransi' => $k->no_asuransi] : null,
            'rincian' => $bill,
        ]]);
    }

    /**
     * POST /api/kasir/tagihan/{id}/bayar
     * Body: branch_id, jumlah_dibayarkan, metode_pembayaran, catatan?
     */
    public function bayar(Request $request, $id)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'jumlah_dibayarkan' => 'required|numeric|min:0',
            'metode_pembayaran' => 'required|in:tunai,asuransi,bpjs,transfer,qris',
            'catatan' => 'nullable|string|max:500',
        ]);

        $k = Kunjungan::with(['pasien:id,no_rm,nama', 'pemeriksaanDokter', 'kasir:id,name'])
            ->forBranch((int) $validated['branch_id'])
            ->findOrFail($id);

        $bill = $this->computeBill($k);
        $bayar = (float) $validated['jumlah_dibayarkan'];

        if ($bayar < $bill['total']) {
            return response()->json([
                'success' => false,
                'message' => 'Jumlah dibayarkan kurang dari total tagihan',
                'data' => ['totalTagihan' => $bill['total'], 'kurang' => $bill['total'] - $bayar],
            ], 422);
        }

        $k->update([
            'status_bayar' => 'lunas',
            'jumlah_dibayarkan' => $bayar,
            'tanggal_bayar' => now(),
            'kasir_id' => Auth::id(),
            'metode_pembayaran' => $validated['metode_pembayaran'],
            'catatan_bayar' => $validated['catatan'],
        ]);
        $k->load('kasir:id,name');

        return response()->json(['success' => true, 'message' => 'Pembayaran berhasil disimpan', 'data' => [
            'noPendaftaran' => $k->no_pendaftaran,
            'statusBayar' => 'lunas',
            'jumlahDibayarkan' => $bayar,
            'totalTagihan' => $bill['total'],
            'kembalian' => $bayar - $bill['total'],
            'metodePembayaran' => $k->metode_pembayaran,
            'tanggalBayar' => $k->tanggal_bayar?->format('Y-m-d H:i:s'),
            'kasirNama' => $k->kasir?->name,
            'pasienNama' => $k->pasien?->nama,
            'pasienNoRm' => $k->pasien?->no_rm,
        ]]);
    }
}
