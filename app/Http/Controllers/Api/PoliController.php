<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Poli;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PoliController extends Controller
{
    /**
     * GET /api/poli?branch_id=1
     * Optional: ?unit_lokasi_id=X untuk filter per unit lokasi.
     */
    public function index(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'unit_lokasi_id' => 'nullable|integer|exists:unit_lokasi,id',
        ]);

        $query = Poli::with(['branch:id,name,code', 'unitLokasi:id,kode,nama_unit', 'depoObat:id,nama_depo'])
            ->withCount('ruangans')
            ->forBranch($request->branch_id)
            ->orderBy('kode');

        if ($request->filled('unit_lokasi_id')) {
            $query->where('unit_lokasi_id', $request->unit_lokasi_id);
        }

        $polis = $query->get()->map(fn ($p) => $this->transform($p));

        return response()->json(['success' => true, 'data' => $polis]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'unit_lokasi_id' => 'nullable|integer|exists:unit_lokasi,id',
            'depo_obat_id' => 'nullable|integer|exists:depo_obat,id',
            'kode' => [
                'required', 'string', 'max:50',
                Rule::unique('poli', 'kode')->where('branch_id', $request->branch_id),
            ],
            'nama' => 'required|string|max:255',
            'jenis_poli' => 'nullable|string|max:100',
            'antrian_ftkp' => 'nullable|boolean',
            'status' => 'nullable|in:aktif,nonaktif',
        ]);

        // Pastikan unit_lokasi_id & depo_obat_id berada di branch yang sama
        if (!empty($validated['unit_lokasi_id'])) {
            $this->ensureSameBranch(
                \App\Models\UnitLokasi::class, $validated['unit_lokasi_id'], $validated['branch_id'], 'unit_lokasi_id'
            );
        }
        if (!empty($validated['depo_obat_id'])) {
            $this->ensureSameBranch(
                \App\Models\DepoObat::class, $validated['depo_obat_id'], $validated['branch_id'], 'depo_obat_id'
            );
        }

        $poli = Poli::create([
            'branch_id' => $validated['branch_id'],
            'unit_lokasi_id' => $validated['unit_lokasi_id'] ?? null,
            'depo_obat_id' => $validated['depo_obat_id'] ?? null,
            'kode' => $validated['kode'],
            'nama' => $validated['nama'],
            'jenis_poli' => $validated['jenis_poli'] ?? null,
            'antrian_ftkp' => $validated['antrian_ftkp'] ?? false,
            'status' => $validated['status'] ?? 'aktif',
        ])->load(['branch:id,name,code', 'unitLokasi:id,kode,nama_unit', 'depoObat:id,nama_depo']);

        return response()->json([
            'success' => true,
            'message' => 'Poli berhasil ditambahkan',
            'data' => $this->transform($poli),
        ], 201);
    }

    public function show($id)
    {
        $poli = Poli::with(['branch:id,name,code', 'unitLokasi:id,kode,nama_unit', 'depoObat:id,nama_depo'])
            ->withCount('ruangans')
            ->findOrFail($id);
        return response()->json(['success' => true, 'data' => $this->transform($poli)]);
    }

    public function update(Request $request, $id)
    {
        $poli = Poli::findOrFail($id);

        $validated = $request->validate([
            'unit_lokasi_id' => 'nullable|integer|exists:unit_lokasi,id',
            'depo_obat_id' => 'nullable|integer|exists:depo_obat,id',
            'kode' => [
                'required', 'string', 'max:50',
                Rule::unique('poli', 'kode')
                    ->where('branch_id', $poli->branch_id)
                    ->ignore($poli->id),
            ],
            'nama' => 'required|string|max:255',
            'jenis_poli' => 'nullable|string|max:100',
            'antrian_ftkp' => 'nullable|boolean',
            'status' => 'nullable|in:aktif,nonaktif',
        ]);

        if (array_key_exists('unit_lokasi_id', $validated) && $validated['unit_lokasi_id'] !== null) {
            $this->ensureSameBranch(
                \App\Models\UnitLokasi::class, $validated['unit_lokasi_id'], $poli->branch_id, 'unit_lokasi_id'
            );
        }
        if (array_key_exists('depo_obat_id', $validated) && $validated['depo_obat_id'] !== null) {
            $this->ensureSameBranch(
                \App\Models\DepoObat::class, $validated['depo_obat_id'], $poli->branch_id, 'depo_obat_id'
            );
        }

        $poli->update($validated);
        $poli->load(['branch:id,name,code', 'unitLokasi:id,kode,nama_unit', 'depoObat:id,nama_depo']);
        $poli->loadCount('ruangans');

        return response()->json([
            'success' => true,
            'message' => 'Poli berhasil diperbarui',
            'data' => $this->transform($poli),
        ]);
    }

    public function destroy($id)
    {
        $poli = Poli::findOrFail($id);
        $poli->delete();
        return response()->json(['success' => true, 'message' => 'Poli berhasil dihapus']);
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

    private function transform(Poli $p): array
    {
        return [
            'id' => $p->id,
            'branch_id' => $p->branch_id,
            'unit_lokasi_id' => $p->unit_lokasi_id,
            'depo_obat_id' => $p->depo_obat_id,
            'kode' => $p->kode,
            'nama' => $p->nama,
            'jenisPoli' => $p->jenis_poli,
            'antrianFTKP' => (bool) $p->antrian_ftkp,
            'status' => $p->status,
            'jumlahRuangan' => $p->ruangans_count ?? 0,
            'unitLokasi' => $p->unitLokasi ? [
                'id' => $p->unitLokasi->id,
                'kode' => $p->unitLokasi->kode,
                'namaUnit' => $p->unitLokasi->nama_unit,
            ] : null,
            'depoObat' => $p->depoObat ? [
                'id' => $p->depoObat->id,
                'namaDepo' => $p->depoObat->nama_depo,
            ] : null,
            'created_at' => $p->created_at?->toIso8601String(),
            'updated_at' => $p->updated_at?->toIso8601String(),
        ];
    }
}
