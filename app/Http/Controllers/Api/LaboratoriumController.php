<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kunjungan;
use App\Models\LabPermintaan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LaboratoriumController extends Controller
{
    /**
     * GET /api/laboratorium?branch_id=&status=&date_from=&date_to=&q=&limit
     * Daftar permintaan lab (di-scope branch aktif).
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'status' => 'nullable|in:menunggu,selesai,dibatalkan',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'q' => 'nullable|string|max:200',
            'limit' => 'nullable|integer|min:1|max:500',
        ]);

        $query = LabPermintaan::with([
            'kunjungan:id,no_pendaftaran,tgl_jam_kunjungan',
            'pasien:id,no_rm,nama,jenis_kelamin',
            'creator:id,name',
        ])
            ->forBranch((int) $validated['branch_id'])
            ->orderByDesc('created_at');

        if (! empty($validated['status'])) $query->where('status', $validated['status']);
        if (! empty($validated['date_from'])) $query->whereDate('created_at', '>=', $validated['date_from']);
        if (! empty($validated['date_to'])) $query->whereDate('created_at', '<=', $validated['date_to']);

        if (! empty($validated['q'])) {
            $needle = '%' . $validated['q'] . '%';
            $query->whereHas('pasien', fn ($p) => $p->where('nama', 'like', $needle)->orWhere('no_rm', 'like', $needle));
        }

        $items = $query->limit($validated['limit'] ?? 200)->get()->map(fn ($l) => [
            'id' => $l->id,
            'kunjunganId' => $l->kunjungan_id,
            'noPendaftaran' => $l->kunjungan?->no_pendaftaran,
            'tanggal' => $l->created_at?->toIso8601String(),
            'jenisPemeriksaan' => $l->jenis_pemeriksaan,
            'status' => $l->status,
            'hasil' => $l->hasil,
            'catatan' => $l->catatan,
            'pasien' => $l->pasien ? ['id' => $l->pasien->id, 'noRm' => $l->pasien->no_rm, 'nama' => $l->pasien->nama] : null,
            'createdBy' => $l->creator?->name,
        ]);

        return response()->json(['success' => true, 'data' => $items]);
    }

    /**
     * POST /api/laboratorium
     * Body: branch_id, kunjungan_id, jenis_pemeriksaan, catatan?
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'kunjungan_id' => 'required|integer|exists:kunjungan,id',
            'jenis_pemeriksaan' => 'required|string|max:255',
            'catatan' => 'nullable|string',
        ]);

        $branchId = (int) $validated['branch_id'];

        // Anti-IDOR: kunjungan harus milik branch yang sama
        $kunjungan = Kunjungan::forBranch($branchId)->findOrFail($validated['kunjungan_id']);

        $lab = LabPermintaan::create([
            'branch_id' => $branchId,
            'kunjungan_id' => $kunjungan->id,
            'pasien_id' => $kunjungan->pasien_id,
            'jenis_pemeriksaan' => $validated['jenis_pemeriksaan'],
            'status' => 'menunggu',
            'catatan' => $validated['catatan'] ?? null,
            'created_by' => Auth::id(),
        ]);

        return response()->json(['success' => true, 'message' => 'Permintaan laboratorium dibuat', 'data' => ['id' => $lab->id]], 201);
    }

    /**
     * PUT /api/laboratorium/{id}
     * Body: branch_id, status(selesai|dibatalkan), hasil?, catatan?
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'status' => 'required|in:menunggu,selesai,dibatalkan',
            'hasil' => 'nullable|string',
            'catatan' => 'nullable|string',
        ]);

        $lab = LabPermintaan::forBranch((int) $validated['branch_id'])->findOrFail($id);

        $lab->update([
            'status' => $validated['status'],
            'hasil' => $validated['hasil'] ?? $lab->hasil,
            'catatan' => $validated['catatan'] ?? $lab->catatan,
        ]);

        return response()->json(['success' => true, 'message' => 'Hasil laboratorium diperbarui']);
    }
}
