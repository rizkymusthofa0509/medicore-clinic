<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AturanPakai;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AturanPakaiController extends Controller
{
    /**
     * GET /api/aturan-pakai?branch_id=1
     * Optional: ?only_active=1 untuk filter yang aktif saja (untuk dropdown resep).
     */
    public function index(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'only_active' => 'nullable|boolean',
            'q' => 'nullable|string|max:200',
        ]);

        $query = AturanPakai::with('branch:id,name,code')
            ->forBranch($request->branch_id)
            ->orderBy('aturan');

        if ($request->boolean('only_active')) {
            $query->where('status_aktif', true);
        }

        if ($request->filled('q')) {
            $query->where('aturan', 'like', '%' . $request->q . '%')->limit(25);
        }

        $items = $query->get()->map(fn ($a) => $this->transform($a));

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'aturan' => [
                'required', 'string', 'max:255',
                Rule::unique('aturan_pakai', 'aturan')->where('branch_id', $request->branch_id),
            ],
            'status_aktif' => 'nullable|boolean',
        ]);

        $aturan = AturanPakai::create([
            'branch_id' => $validated['branch_id'],
            'aturan' => $validated['aturan'],
            'status_aktif' => $validated['status_aktif'] ?? true,
        ])->load('branch:id,name,code');

        return response()->json([
            'success' => true,
            'message' => 'Aturan pakai berhasil ditambahkan',
            'data' => $this->transform($aturan),
        ], 201);
    }

    public function show($id)
    {
        $aturan = AturanPakai::with('branch:id,name,code')->findOrFail($id);

        return response()->json(['success' => true, 'data' => $this->transform($aturan)]);
    }

    public function update(Request $request, $id)
    {
        $aturan = AturanPakai::findOrFail($id);

        $validated = $request->validate([
            'aturan' => [
                'required', 'string', 'max:255',
                Rule::unique('aturan_pakai', 'aturan')
                    ->where('branch_id', $aturan->branch_id)
                    ->ignore($aturan->id),
            ],
            'status_aktif' => 'nullable|boolean',
        ]);

        $aturan->update($validated);
        $aturan->load('branch:id,name,code');

        return response()->json([
            'success' => true,
            'message' => 'Aturan pakai berhasil diperbarui',
            'data' => $this->transform($aturan),
        ]);
    }

    public function destroy($id)
    {
        $aturan = AturanPakai::findOrFail($id);
        $aturan->delete();

        return response()->json([
            'success' => true,
            'message' => 'Aturan pakai berhasil dihapus',
        ]);
    }

    private function transform(AturanPakai $a): array
    {
        return [
            'id' => $a->id,
            'branch_id' => $a->branch_id,
            'aturan' => $a->aturan,
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
