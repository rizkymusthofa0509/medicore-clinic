<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ObatAlkes;
use App\Models\PemeriksaanDokter;
use App\Models\StokMutasi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class FarmasiController extends Controller
{
    /**
     * GET /api/farmasi/resep
     * Antrian resep menunggu verifikasi / sudah dispensed (per branch).
     * Query: branch_id, status(menunggu|dispensed), date_from, date_to, q, limit
     */
    public function resep(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'status' => 'nullable|in:menunggu,dispensed,dibatalkan',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'q' => 'nullable|string|max:200',
            'limit' => 'nullable|integer|min:1|max:500',
        ]);

        $branchId = (int) $validated['branch_id'];

        $query = PemeriksaanDokter::with([
            'kunjungan:id,no_pendaftaran,tgl_jam_kunjungan,status,status_bayar',
            'kunjungan.pasien:id,no_rm,nama,jenis_kelamin,tanggal_lahir',
            'kunjungan.poli:id,nama',
            'dokter:id,nama',
            'creator:id,name',
        ])
            ->forBranch($branchId)
            ->where('status', 'final')
            ->whereHas('kunjungan', fn ($q) => $q->where('status', '!=', 'batal'));

        if (! empty($validated['status'])) {
            $query->where('status_farmasi', $validated['status']);
        } else {
            $query->where('status_farmasi', '!=', 'dibatalkan');
        }

        if (! empty($validated['date_from'])) $query->whereDate('created_at', '>=', $validated['date_from']);
        if (! empty($validated['date_to'])) $query->whereDate('created_at', '<=', $validated['date_to']);

        if (! empty($validated['q'])) {
            $needle = '%' . $validated['q'] . '%';
            $query->where(function ($w) use ($needle) {
                $w->whereHas('kunjungan', function ($k) use ($needle) {
                    $k->where('no_pendaftaran', 'like', $needle)
                        ->orWhereHas('pasien', fn ($p) => $p->where('no_rm', 'like', $needle)->orWhere('nama', 'like', $needle));
                });
            });
        }

        $items = $query->orderByDesc('created_at')
            ->limit($validated['limit'] ?? 200)
            ->get()
            ->map(fn ($pd) => $this->transformResep($pd));

        return response()->json(['success' => true, 'data' => $items]);
    }

    /**
     * POST /api/farmasi/resep/{id}/dispense
     * Dispensing: verifikasi & kurangi stok obat, catat mutasi, update status_farmasi.
     */
    public function dispense(Request $request, $id)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'catatan' => 'nullable|string|max:500',
        ]);

        $branchId = (int) $validated['branch_id'];

        $pd = PemeriksaanDokter::with(['kunjungan:id,branch_id,no_pendaftaran,status'])
            ->forBranch($branchId)
            ->findOrFail($id);

        if ($pd->status_farmasi === 'dispensed') {
            return response()->json(['success' => false, 'message' => 'Resep sudah didispensasi'], 422);
        }

        $masalah = [];
        $items = $pd->pemberian_obat ?? [];

        DB::transaction(function () use ($pd, $items, $branchId, $validated, &$masalah) {
            foreach ($items as $row) {
                $nama = trim((string) ($row['namaObat'] ?? ''));
                $jumlah = (int) ($row['jumlah'] ?? 0);
                if ($nama === '' || $jumlah <= 0) continue;

                // Cari obat di master (nama persis / fallback like)
                $obat = ObatAlkes::forBranch($branchId)
                    ->where(fn ($q) => $q->where('nama', $nama)->orWhere('nama', 'like', '%' . $nama . '%'))
                    ->first();

                if (! $obat) {
                    $masalah[] = $nama . ' (obat tidak ditemukan di master)';
                    continue;
                }
                if ((int) $obat->stok < $jumlah) {
                    $masalah[] = $nama . ' (stok tidak cukup: ' . (int) $obat->stok . ')';
                    continue;
                }

                $stokSebelum = (int) $obat->stok;
                $obat->decrement('stok', $jumlah);

                StokMutasi::create([
                    'branch_id' => $branchId,
                    'obat_alkes_id' => $obat->id,
                    'tipe' => 'dispensing',
                    'qty' => $jumlah,
                    'stok_sebelum' => $stokSebelum,
                    'stok_sesudah' => $stokSebelum - $jumlah,
                    'harga_satuan' => (int) ($row['harga'] ?? 0),
                    'ref_type' => 'pemeriksaan_dokter',
                    'ref_id' => $pd->id,
                    'keterangan' => 'Dispensing resep ' . $pd->kunjungan?->no_pendaftaran . ' — ' . $nama,
                    'created_by' => Auth::id(),
                ]);
            }

            $pd->update([
                'status_farmasi' => 'dispensed',
                'catatan_farmasi' => $validated['catatan'] ?? null,
            ]);
        });

        if (count($masalah) > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Sebagian item tidak didispensasi: ' . implode(', ', $masalah),
                'data' => ['masalah' => $masalah],
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Resep berhasil didispensasi, stok obat berkurang',
        ]);
    }

    /**
     * POST /api/farmasi/resep/{id}/batalkan
     */
    public function batalkan(Request $request, $id)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'catatan' => 'required|string|max:500',
        ]);

        $pd = PemeriksaanDokter::forBranch((int) $validated['branch_id'])->findOrFail($id);

        if ($pd->status_farmasi === 'dispensed') {
            return response()->json(['success' => false, 'message' => 'Resep sudah didispensasi, tidak bisa dibatalkan'], 422);
        }

        $pd->update([
            'status_farmasi' => 'dibatalkan',
            'catatan_farmasi' => $validated['catatan'],
        ]);

        return response()->json(['success' => true, 'message' => 'Resep dibatalkan']);
    }

    /**
     * GET /api/farmasi/stok
     * Riwayat mutasi stok (per branch). Query: branch_id, tipe, date_from, date_to, q, limit
     */
    public function stok(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'tipe' => 'nullable|in:masuk,keluar,dispensing,opname,penyesuaian',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'q' => 'nullable|string|max:200',
            'limit' => 'nullable|integer|min:1|max:500',
        ]);

        $query = StokMutasi::with([
            'obatAlkes:id,nama,satuan_terkecil,harga_jual',
            'creator:id,name',
        ])
            ->forBranch((int) $validated['branch_id'])
            ->orderByDesc('created_at');

        if (! empty($validated['tipe'])) $query->where('tipe', $validated['tipe']);
        if (! empty($validated['date_from'])) $query->whereDate('created_at', '>=', $validated['date_from']);
        if (! empty($validated['date_to'])) $query->whereDate('created_at', '<=', $validated['date_to']);

        if (! empty($validated['q'])) {
            $needle = '%' . $validated['q'] . '%';
            $query->whereHas('obatAlkes', fn ($o) => $o->where('nama', 'like', $needle));
        }

        $items = $query->limit($validated['limit'] ?? 200)->get()->map(fn ($m) => [
            'id' => $m->id,
            'tipe' => $m->tipe,
            'qty' => $m->qty,
            'stokSebelum' => $m->stok_sebelum,
            'stokSesudah' => $m->stok_sesudah,
            'hargaSatuan' => $m->harga_satuan,
            'keterangan' => $m->keterangan,
            'obat' => $m->obatAlkes ? ['id' => $m->obatAlkes->id, 'nama' => $m->obatAlkes->nama] : null,
            'createdAt' => $m->created_at?->toIso8601String(),
            'createdBy' => $m->creator?->name,
        ]);

        return response()->json(['success' => true, 'data' => $items]);
    }

    /**
     * Transform resep → FE (camelCase, include pemberian_obat + status farmasi).
     */
    private function transformResep(PemeriksaanDokter $pd): array
    {
        $k = $pd->kunjungan;

        return [
            'id' => $pd->id,
            'kunjunganId' => $pd->kunjungan_id,
            'noPendaftaran' => $k?->no_pendaftaran,
            'tanggal' => $k?->tgl_jam_kunjungan?->format('Y-m-d H:i:s') ?? $pd->created_at?->toIso8601String(),
            'status' => $k?->status,
            'statusBayar' => $k?->status_bayar ?? 'belum_bayar',
            'statusFarmasi' => $pd->status_farmasi ?? 'menunggu',
            'catatanFarmasi' => $pd->catatan_farmasi,
            'pasien' => $k?->pasien ? ['id' => $k->pasien->id, 'noRm' => $k->pasien->no_rm, 'nama' => $k->pasien->nama] : null,
            'poli' => $k?->poli ? ['nama' => $k->poli->nama] : null,
            'dokter' => $pd->dokter ? ['id' => $pd->dokter->id, 'nama' => $pd->dokter->nama] : null,
            'pemberianObat' => $pd->pemberian_obat ?? [],
            'pemberianObatRacik' => $pd->pemberian_obat_racik ?? [],
            'totalObat' => collect($pd->pemberian_obat ?? [])->sum(fn ($r) => (float) ($r['harga'] ?? 0) * (int) ($r['jumlah'] ?? 0)),
            'createdAt' => $pd->created_at?->toIso8601String(),
        ];
    }
}
