<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DepoObat;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DepoObatController extends Controller
{
    /**
     * GET /api/depo-obat?branch_id=1
     * Daftar depo obat, di-scope ke branch_id.
     * branch_id WAJIB ada untuk memastikan pemisahan data per branch.
     */
    public function index(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
        ]);

        $depos = DepoObat::with('branch:id,name,code')
            ->forBranch($request->branch_id)
            ->orderBy('nama_depo')
            ->get()
            ->map(fn ($d) => $this->transform($d));

        return response()->json([
            'success' => true,
            'data' => $depos,
        ]);
    }

    /**
     * POST /api/depo-obat
     * Body: { branch_id, nama_depo, lokasi?, keterangan?, status? }
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'nama_depo' => [
                'required',
                'string',
                'max:255',
                Rule::unique('depo_obat', 'nama_depo')->where('branch_id', $request->branch_id),
            ],
            'lokasi' => 'nullable|string|max:255',
            'keterangan' => 'nullable|string|max:500',
            'status' => 'nullable|in:aktif,nonaktif',
        ]);

        $depo = DepoObat::create([
            'branch_id' => $validated['branch_id'],
            'nama_depo' => $validated['nama_depo'],
            'lokasi' => $validated['lokasi'] ?? null,
            'keterangan' => $validated['keterangan'] ?? null,
            'status' => $validated['status'] ?? 'aktif',
        ])->load('branch:id,name,code');

        return response()->json([
            'success' => true,
            'message' => 'Depo obat berhasil ditambahkan',
            'data' => $this->transform($depo),
        ], 201);
    }

    /**
     * GET /api/depo-obat/{id}
     */
    public function show($id)
    {
        $depo = DepoObat::with('branch:id,name,code')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $this->transform($depo),
        ]);
    }

    /**
     * PUT /api/depo-obat/{id}
     */
    public function update(Request $request, $id)
    {
        $depo = DepoObat::findOrFail($id);

        $validated = $request->validate([
            'nama_depo' => [
                'required',
                'string',
                'max:255',
                Rule::unique('depo_obat', 'nama_depo')
                    ->where('branch_id', $depo->branch_id)
                    ->ignore($depo->id),
            ],
            'lokasi' => 'nullable|string|max:255',
            'keterangan' => 'nullable|string|max:500',
            'status' => 'nullable|in:aktif,nonaktif',
        ]);

        $depo->update($validated);
        $depo->load('branch:id,name,code');

        return response()->json([
            'success' => true,
            'message' => 'Depo obat berhasil diperbarui',
            'data' => $this->transform($depo),
        ]);
    }

    /**
     * DELETE /api/depo-obat/{id}
     */
    public function destroy($id)
    {
        $depo = DepoObat::findOrFail($id);
        $depo->delete();

        return response()->json([
            'success' => true,
            'message' => 'Depo obat berhasil dihapus',
        ]);
    }

    /**
     * Shape response agar konsisten untuk FE.
     * FE pakai field: id, namaDepo, lokasi, keterangan, branchId.
     */
    private function transform(DepoObat $d): array
    {
        return [
            'id' => $d->id,
            'branch_id' => $d->branch_id,
            'namaDepo' => $d->nama_depo,
            'lokasi' => $d->lokasi,
            'keterangan' => $d->keterangan,
            'status' => $d->status,
            'branch' => $d->branch ? [
                'id' => $d->branch->id,
                'name' => $d->branch->name,
                'code' => $d->branch->code,
            ] : null,
            'created_at' => $d->created_at?->toIso8601String(),
            'updated_at' => $d->updated_at?->toIso8601String(),
        ];
    }
}
