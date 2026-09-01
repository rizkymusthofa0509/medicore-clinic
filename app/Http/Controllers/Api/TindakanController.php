<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Poli;
use App\Models\Tindakan;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TindakanController extends Controller
{
    /**
     * GET /api/tindakan?branch_id=1
     * Optional: ?poli_id=X untuk filter per poli.
     */
    public function index(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'poli_id' => 'nullable|integer|exists:poli,id',
            'q' => 'nullable|string|max:200',
        ]);

        $query = Tindakan::with(['branch:id,name,code', 'poli:id,kode,nama'])
            ->forBranch($request->branch_id)
            ->orderBy('kode_icd9');

        if ($request->filled('poli_id')) {
            $query->where('poli_id', $request->poli_id);
        }

        if ($request->filled('q')) {
            $needle = '%' . $request->q . '%';
            $query->where(function ($w) use ($needle) {
                $w->where('nama_tindakan', 'like', $needle)
                  ->orWhere('kode_icd9', 'like', $needle)
                  ->orWhere('kelompok_tindakan', 'like', $needle);
            })->limit(25);
        }

        $items = $query->get()->map(fn ($t) => $this->transform($t));

        return response()->json(['success' => true, 'data' => $items]);
    }

    /**
     * POST /api/tindakan
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'poli_id' => 'nullable|integer|exists:poli,id',
            'kelompok_tindakan' => 'nullable|string|max:255',
            'kode_icd9' => [
                'required', 'string', 'max:50',
                Rule::unique('tindakan', 'kode_icd9')->where('branch_id', $request->branch_id),
            ],
            'nama_tindakan' => 'required|string|max:255',
            'jumlah_biaya' => 'nullable|integer|min:0',
            'jasa_dokter' => 'nullable|integer|min:0',
            'persentase_dokter' => 'nullable|integer|min:0|max:100',
            'rupiah_dokter' => 'nullable|integer|min:0',
            'jasa_asisten' => 'nullable|integer|min:0',
            'persentase_asisten' => 'nullable|integer|min:0|max:100',
            'rupiah_asisten' => 'nullable|integer|min:0',
            'jasa_klinik' => 'nullable|integer|min:0',
            'persentase_klinik' => 'nullable|integer|min:0|max:100',
            'rupiah_klinik' => 'nullable|integer|min:0',
            'status' => 'nullable|in:aktif,nonaktif',
        ]);

        // Pastikan poli_id berada di branch yang sama
        if (!empty($validated['poli_id'])) {
            $this->ensureSameBranch(
                Poli::class, $validated['poli_id'], $validated['branch_id'], 'poli_id'
            );
        }

        $tindakan = Tindakan::create([
            'branch_id' => $validated['branch_id'],
            'poli_id' => $validated['poli_id'] ?? null,
            'kelompok_tindakan' => $validated['kelompok_tindakan'] ?? null,
            'kode_icd9' => $validated['kode_icd9'],
            'nama_tindakan' => $validated['nama_tindakan'],
            'jumlah_biaya' => $validated['jumlah_biaya'] ?? 0,
            'jasa_dokter' => $validated['jasa_dokter'] ?? 0,
            'persentase_dokter' => $validated['persentase_dokter'] ?? 0,
            'rupiah_dokter' => $validated['rupiah_dokter'] ?? 0,
            'jasa_asisten' => $validated['jasa_asisten'] ?? 0,
            'persentase_asisten' => $validated['persentase_asisten'] ?? 0,
            'rupiah_asisten' => $validated['rupiah_asisten'] ?? 0,
            'jasa_klinik' => $validated['jasa_klinik'] ?? 0,
            'persentase_klinik' => $validated['persentase_klinik'] ?? 0,
            'rupiah_klinik' => $validated['rupiah_klinik'] ?? 0,
            'status' => $validated['status'] ?? 'aktif',
        ])->load(['branch:id,name,code', 'poli:id,kode,nama']);

        return response()->json([
            'success' => true,
            'message' => 'Tindakan berhasil ditambahkan',
            'data' => $this->transform($tindakan),
        ], 201);
    }

    /**
     * GET /api/tindakan/{id}
     */
    public function show($id)
    {
        $tindakan = Tindakan::with(['branch:id,name,code', 'poli:id,kode,nama'])
            ->findOrFail($id);

        return response()->json(['success' => true, 'data' => $this->transform($tindakan)]);
    }

    /**
     * PUT /api/tindakan/{id}
     */
    public function update(Request $request, $id)
    {
        $tindakan = Tindakan::findOrFail($id);

        $validated = $request->validate([
            'poli_id' => 'nullable|integer|exists:poli,id',
            'kelompok_tindakan' => 'nullable|string|max:255',
            'kode_icd9' => [
                'required', 'string', 'max:50',
                Rule::unique('tindakan', 'kode_icd9')
                    ->where('branch_id', $tindakan->branch_id)
                    ->ignore($tindakan->id),
            ],
            'nama_tindakan' => 'required|string|max:255',
            'jumlah_biaya' => 'nullable|integer|min:0',
            'jasa_dokter' => 'nullable|integer|min:0',
            'persentase_dokter' => 'nullable|integer|min:0|max:100',
            'rupiah_dokter' => 'nullable|integer|min:0',
            'jasa_asisten' => 'nullable|integer|min:0',
            'persentase_asisten' => 'nullable|integer|min:0|max:100',
            'rupiah_asisten' => 'nullable|integer|min:0',
            'jasa_klinik' => 'nullable|integer|min:0',
            'persentase_klinik' => 'nullable|integer|min:0|max:100',
            'rupiah_klinik' => 'nullable|integer|min:0',
            'status' => 'nullable|in:aktif,nonaktif',
        ]);

        if (array_key_exists('poli_id', $validated) && $validated['poli_id'] !== null) {
            $this->ensureSameBranch(
                Poli::class, $validated['poli_id'], $tindakan->branch_id, 'poli_id'
            );
        }

        $tindakan->update($validated);
        $tindakan->load(['branch:id,name,code', 'poli:id,kode,nama']);

        return response()->json([
            'success' => true,
            'message' => 'Tindakan berhasil diperbarui',
            'data' => $this->transform($tindakan),
        ]);
    }

    /**
     * DELETE /api/tindakan/{id}
     */
    public function destroy($id)
    {
        $tindakan = Tindakan::findOrFail($id);
        $tindakan->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tindakan berhasil dihapus',
        ]);
    }

    private function ensureSameBranch(string $modelClass, int $id, int $branchId, string $fieldName): void
    {
        $model = $modelClass::find($id);
        if (! $model) {
            abort(404, "Resource {$fieldName} tidak ditemukan");
        }
        if ((int) $model->branch_id !== (int) $branchId) {
            abort(422, "{$fieldName} bukan milik branch ini");
        }
    }

    /**
     * Shape response agar konsisten untuk FE.
     * FE pakai field camelCase: kelompokTindakan, kodeICD9, namaTindakan, poliId, jumlahBiaya, dll.
     */
    private function transform(Tindakan $t): array
    {
        return [
            'id' => $t->id,
            'branch_id' => $t->branch_id,
            'poli_id' => $t->poli_id,
            'kelompokTindakan' => $t->kelompok_tindakan,
            'kodeICD9' => $t->kode_icd9,
            'namaTindakan' => $t->nama_tindakan,
            'jumlahBiaya' => (int) $t->jumlah_biaya,
            'jasaDokter' => (int) $t->jasa_dokter,
            'persentaseDokter' => (int) $t->persentase_dokter,
            'rupiahDokter' => (int) $t->rupiah_dokter,
            'jasaAsisten' => (int) $t->jasa_asisten,
            'persentaseAsisten' => (int) $t->persentase_asisten,
            'rupiahAsisten' => (int) $t->rupiah_asisten,
            'jasaKlinik' => (int) $t->jasa_klinik,
            'persentaseKlinik' => (int) $t->persentase_klinik,
            'rupiahKlinik' => (int) $t->rupiah_klinik,
            'status' => $t->status,
            'poli' => $t->poli ? [
                'id' => $t->poli->id,
                'kode' => $t->poli->kode,
                'nama' => $t->poli->nama,
            ] : null,
            'branch' => $t->branch ? [
                'id' => $t->branch->id,
                'name' => $t->branch->name,
                'code' => $t->branch->code,
            ] : null,
            'created_at' => $t->created_at?->toIso8601String(),
            'updated_at' => $t->updated_at?->toIso8601String(),
        ];
    }
}
