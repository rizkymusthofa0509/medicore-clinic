<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kunjungan;
use App\Models\PemeriksaanDokter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;

class PemeriksaanDokterController extends Controller
{
    /**
     * GET /api/kunjungan/{id}/pemeriksaan-dokter
     * Ambil pemeriksaan dokter untuk kunjungan (null jika belum ada).
     */
    public function show($id)
    {
        $kunjungan = $this->resolveKunjungan($id);

        $pd = $kunjungan->pemeriksaanDokter;

        return response()->json([
            'success' => true,
            'data' => $pd ? $this->transform($pd) : null,
        ]);
    }

    /**
     * GET /api/pemeriksaan-dokter?branch_id=&pasien_id=
     * Daftar pemeriksaan dokter per branch (untuk riwayat pemeriksaan pasien).
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'pasien_id' => 'nullable|integer|exists:pasien,id',
            'limit' => 'nullable|integer|min:1|max:500',
        ]);

        $query = PemeriksaanDokter::with([
            'kunjungan:id,no_pendaftaran,tgl_jam_kunjungan,status,tipe_kunjungan,jenis_kunjungan',
            'dokter:id,nama',
            'poli:id,nama',
        ])->forBranch($validated['branch_id'])
          ->orderByDesc('id');

        if (! empty($validated['pasien_id'])) {
            $query->where('pasien_id', $validated['pasien_id']);
        }

        $items = $query->limit($validated['limit'] ?? 100)->get()->map(fn ($pd) => $this->transform($pd));

        return response()->json(['success' => true, 'data' => $items]);
    }

    /**
     * POST /api/kunjungan/{id}/pemeriksaan-dokter
     * Create-or-update pemeriksaan dokter. Semua section disimpan sebagai JSON.
     */
    public function store(Request $request, $id)
    {
        $kunjungan = $this->resolveKunjungan($id);

        $validated = $request->validate([
            'status' => 'nullable|in:draft,final',
            'registrasi' => 'nullable|array',
            'ttv' => 'nullable|array',
            'pemeriksaan_fisik' => 'nullable|array',
            'anatomi' => 'nullable|array',
            'riwayat_alergi' => 'nullable|array',
            'riwayat_obat' => 'nullable|array',
            'riwayat_penyakit' => 'nullable|array',
            'diagnosa' => 'nullable|array',
            'pemberian_obat' => 'nullable|array',
            'pemberian_obat_racik' => 'nullable|array',
            'pemberian_tindakan' => 'nullable|array',
            'catatan' => 'nullable|array',
        ]);

        $pd = PemeriksaanDokter::updateOrCreate(
            ['kunjungan_id' => $kunjungan->id],
            array_merge($validated, [
                'branch_id' => $kunjungan->branch_id,
                'pasien_id' => $kunjungan->pasien_id,
                'poli_id' => $kunjungan->poli_id,
                'dokter_id' => $kunjungan->dokter_id ?? $kunjungan->dokter_pengganti_id,
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
            ])
        );

        // Finalisasi menandai kunjungan selesai diperiksa
        if (($validated['status'] ?? 'draft') === 'final' && in_array($kunjungan->status, ['terdaftar', 'menunggu', 'diperiksa'], true)) {
            $kunjungan->update(['status' => 'selesai']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Pemeriksaan dokter berhasil disimpan',
            'data' => $this->transform($pd->load(['kunjungan:id,no_pendaftaran,status', 'dokter:id,nama'])),
        ]);
    }

    /**
     * Resolve kunjungan (decode id terenkripsi) + cek branch (anti IDOR).
     */
    private function resolveKunjungan($id): Kunjungan
    {
        try {
            $id = (int) Crypt::decryptString($id);
        } catch (\Throwable $e) {
            $id = (int) $id;
        }

        $kunjungan = Kunjungan::with(['pemeriksaanDokter'])->findOrFail($id);

        $user = Auth::user();
        $branchId = $user?->branch_id ?? $kunjungan->branch_id;
        if ((int) $kunjungan->branch_id !== (int) $branchId) {
            abort(response()->json([
                'success' => false,
                'message' => 'Kunjungan bukan milik branch aktif',
            ], 403));
        }

        return $kunjungan;
    }

    /**
     * Shape response camelCase untuk FE.
     */
    private function transform(PemeriksaanDokter $pd): array
    {
        return [
            'id' => $pd->id,
            'branchId' => $pd->branch_id,
            'kunjunganId' => $pd->kunjungan_id,
            'pasienId' => $pd->pasien_id,
            'poliId' => $pd->poli_id,
            'dokterId' => $pd->dokter_id,
            'status' => $pd->status,
            'registrasi' => $pd->registrasi ?? [],
            'ttv' => $pd->ttv ?? [],
            'pemeriksaanFisik' => $pd->pemeriksaan_fisik ?? [],
            'anatomi' => $pd->anatomi ?? [],
            'riwayatAlergi' => $pd->riwayat_alergi ?? [],
            'riwayatObat' => $pd->riwayat_obat ?? [],
            'riwayatPenyakit' => $pd->riwayat_penyakit ?? [],
            'diagnosa' => $pd->diagnosa ?? [],
            'pemberianObat' => $pd->pemberian_obat ?? [],
            'pemberianObatRacik' => $pd->pemberian_obat_racik ?? [],
            'pemberianTindakan' => $pd->pemberian_tindakan ?? [],
            'catatan' => $pd->catatan ?? [],
            'createdAt' => $pd->created_at?->toIso8601String(),
            'updatedAt' => $pd->updated_at?->toIso8601String(),
            'kunjungan' => $pd->relationLoaded('kunjungan') && $pd->kunjungan ? [
                'id' => $pd->kunjungan->id,
                'noPendaftaran' => $pd->kunjungan->no_pendaftaran,
                'tglJamKunjungan' => $pd->kunjungan->tgl_jam_kunjungan?->format('Y-m-d H:i:s'),
                'status' => $pd->kunjungan->status,
                'tipeKunjungan' => $pd->kunjungan->tipe_kunjungan,
                'jenisKunjungan' => $pd->kunjungan->jenis_kunjungan,
            ] : null,
            'dokter' => $pd->relationLoaded('dokter') && $pd->dokter ? ['id' => $pd->dokter->id, 'nama' => $pd->dokter->nama] : null,
            'poli' => $pd->relationLoaded('poli') && $pd->poli ? ['id' => $pd->poli->id, 'nama' => $pd->poli->nama] : null,
        ];
    }
}
