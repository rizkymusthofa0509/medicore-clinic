<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UnitLokasi;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UnitLokasiController extends Controller
{
    /**
     * GET /api/unit-lokasi?branch_id=1
     */
    public function index(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
        ]);

        $units = UnitLokasi::with('branch:id,name,code')
            ->withCount('polis')
            ->forBranch($request->branch_id)
            ->orderBy('kode')
            ->get()
            ->map(fn ($u) => $this->transform($u));

        return response()->json(['success' => true, 'data' => $units]);
    }

    /**
     * POST /api/unit-lokasi
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'kode' => [
                'required', 'string', 'max:50',
                Rule::unique('unit_lokasi', 'kode')->where('branch_id', $request->branch_id),
            ],
            'nama_unit' => 'required|string|max:255',
            'jenis' => 'required|in:rawat_jalan,rawat_inap,penunjang,umum',
            'lokasi' => 'nullable|string|max:255',
            'keterangan' => 'nullable|string|max:500',
            'status' => 'nullable|in:aktif,nonaktif',
        ]);

        $unit = UnitLokasi::create([
            'branch_id' => $validated['branch_id'],
            'kode' => $validated['kode'],
            'nama_unit' => $validated['nama_unit'],
            'jenis' => $validated['jenis'],
            'lokasi' => $validated['lokasi'] ?? null,
            'keterangan' => $validated['keterangan'] ?? null,
            'status' => $validated['status'] ?? 'aktif',
        ])->load('branch:id,name,code');

        return response()->json([
            'success' => true,
            'message' => 'Unit lokasi berhasil ditambahkan',
            'data' => $this->transform($unit),
        ], 201);
    }

    public function show($id)
    {
        $unit = UnitLokasi::with('branch:id,name,code')->withCount('polis')->findOrFail($id);
        return response()->json(['success' => true, 'data' => $this->transform($unit)]);
    }

    public function update(Request $request, $id)
    {
        $unit = UnitLokasi::findOrFail($id);

        $validated = $request->validate([
            'kode' => [
                'required', 'string', 'max:50',
                Rule::unique('unit_lokasi', 'kode')
                    ->where('branch_id', $unit->branch_id)
                    ->ignore($unit->id),
            ],
            'nama_unit' => 'required|string|max:255',
            'jenis' => 'required|in:rawat_jalan,rawat_inap,penunjang,umum',
            'lokasi' => 'nullable|string|max:255',
            'keterangan' => 'nullable|string|max:500',
            'status' => 'nullable|in:aktif,nonaktif',
        ]);

        $unit->update($validated);
        $unit->load('branch:id,name,code');
        $unit->loadCount('polis');

        return response()->json([
            'success' => true,
            'message' => 'Unit lokasi berhasil diperbarui',
            'data' => $this->transform($unit),
        ]);
    }

    public function destroy($id)
    {
        $unit = UnitLokasi::findOrFail($id);
        $unit->delete();
        return response()->json(['success' => true, 'message' => 'Unit lokasi berhasil dihapus']);
    }

    private function transform(UnitLokasi $u): array
    {
        return [
            'id' => $u->id,
            'branch_id' => $u->branch_id,
            'kode' => $u->kode,
            'namaUnit' => $u->nama_unit,
            'jenis' => $u->jenis,
            'lokasi' => $u->lokasi,
            'keterangan' => $u->keterangan,
            'status' => $u->status,
            'jumlahPoli' => $u->polis_count ?? 0,
            'branch' => $u->branch ? [
                'id' => $u->branch->id,
                'name' => $u->branch->name,
                'code' => $u->branch->code,
            ] : null,
            'created_at' => $u->created_at?->toIso8601String(),
            'updated_at' => $u->updated_at?->toIso8601String(),
        ];
    }
}
