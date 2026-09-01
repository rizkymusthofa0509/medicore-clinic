<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asuransi;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AsuransiController extends Controller
{
    /**
     * GET /api/asuransi?branch_id=1
     */
    public function index(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
        ]);

        $items = Asuransi::with('branch:id,name,code')
            ->forBranch($request->branch_id)
            ->orderBy('nama_perusahaan')
            ->get()
            ->map(fn ($a) => $this->transform($a));

        return response()->json(['success' => true, 'data' => $items]);
    }

    /**
     * POST /api/asuransi
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'nama_perusahaan' => [
                'required', 'string', 'max:255',
                Rule::unique('asuransi', 'nama_perusahaan')->where('branch_id', $request->branch_id),
            ],
            'harga_obat_khusus' => 'nullable|boolean',
            'status_aktif' => 'nullable|boolean',
        ]);

        $asuransi = Asuransi::create([
            'branch_id' => $validated['branch_id'],
            'nama_perusahaan' => $validated['nama_perusahaan'],
            'harga_obat_khusus' => $validated['harga_obat_khusus'] ?? false,
            'status_aktif' => $validated['status_aktif'] ?? true,
        ])->load('branch:id,name,code');

        return response()->json([
            'success' => true,
            'message' => 'Asuransi berhasil ditambahkan',
            'data' => $this->transform($asuransi),
        ], 201);
    }

    /**
     * GET /api/asuransi/{id}
     */
    public function show($id)
    {
        $asuransi = Asuransi::with('branch:id,name,code')->findOrFail($id);

        return response()->json(['success' => true, 'data' => $this->transform($asuransi)]);
    }

    /**
     * PUT /api/asuransi/{id}
     */
    public function update(Request $request, $id)
    {
        $asuransi = Asuransi::findOrFail($id);

        $validated = $request->validate([
            'nama_perusahaan' => [
                'required', 'string', 'max:255',
                Rule::unique('asuransi', 'nama_perusahaan')
                    ->where('branch_id', $asuransi->branch_id)
                    ->ignore($asuransi->id),
            ],
            'harga_obat_khusus' => 'nullable|boolean',
            'status_aktif' => 'nullable|boolean',
        ]);

        $asuransi->update($validated);
        $asuransi->load('branch:id,name,code');

        return response()->json([
            'success' => true,
            'message' => 'Asuransi berhasil diperbarui',
            'data' => $this->transform($asuransi),
        ]);
    }

    /**
     * DELETE /api/asuransi/{id}
     */
    public function destroy($id)
    {
        $asuransi = Asuransi::findOrFail($id);
        $asuransi->delete();

        return response()->json([
            'success' => true,
            'message' => 'Asuransi berhasil dihapus',
        ]);
    }

    /**
     * Shape response FE-friendly: camelCase + boolean ke field yang mudah di-render.
     */
    private function transform(Asuransi $a): array
    {
        return [
            'id' => $a->id,
            'branch_id' => $a->branch_id,
            'namaPerusahaan' => $a->nama_perusahaan,
            'hargaObatKhusus' => (bool) $a->harga_obat_khusus,
            'statusAktif' => (bool) $a->status_aktif,
            'branch' => $a->branch ? [
                'id' => $a->branch->id,
                'name' => $a->branch->name,
                'code' => $a->branch->code,
            ] : null,
            'created_at' => $a->created_at?->toIso8601String(),
            'updated_at' => $a->updated_at?->toIso8601String(),
        ];
    }
}
