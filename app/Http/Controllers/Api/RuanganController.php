<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Poli;
use App\Models\Ruangan;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class RuanganController extends Controller
{
    /**
     * GET /api/ruangan?branch_id=1&poli_id=X
     * branch_id WAJIB; poli_id opsional untuk filter.
     */
    public function index(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'poli_id' => 'nullable|integer|exists:poli,id',
        ]);

        $query = Ruangan::with(['branch:id,name,code', 'poli:id,kode,nama'])
            ->forBranch($request->branch_id)
            ->orderBy('kode');

        if ($request->filled('poli_id')) {
            // Pastikan poli yang difilter memang milik branch tersebut
            $poli = Poli::find($request->poli_id);
            if (! $poli || (int) $poli->branch_id !== (int) $request->branch_id) {
                return response()->json(['success' => true, 'data' => []]);
            }
            $query->where('poli_id', $request->poli_id);
        }

        return response()->json([
            'success' => true,
            'data' => $query->get()->map(fn ($r) => $this->transform($r)),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'poli_id' => 'required|integer|exists:poli,id',
            'kode' => [
                'required', 'string', 'max:50',
                Rule::unique('ruangan', 'kode')->where('poli_id', $request->poli_id),
            ],
            'nama_ruangan' => 'required|string|max:255',
            'kelas' => 'nullable|string|max:50',
            'kapasitas' => 'nullable|integer|min:1',
            'status' => 'nullable|in:tersedia,terisi,maintenance',
            'keterangan' => 'nullable|string|max:500',
        ]);

        $this->ensurePoliInBranch($validated['poli_id'], $validated['branch_id']);

        $ruangan = Ruangan::create([
            'branch_id' => $validated['branch_id'],
            'poli_id' => $validated['poli_id'],
            'kode' => $validated['kode'],
            'nama_ruangan' => $validated['nama_ruangan'],
            'kelas' => $validated['kelas'] ?? null,
            'kapasitas' => $validated['kapasitas'] ?? 1,
            'status' => $validated['status'] ?? 'tersedia',
            'keterangan' => $validated['keterangan'] ?? null,
        ])->load(['branch:id,name,code', 'poli:id,kode,nama']);

        return response()->json([
            'success' => true,
            'message' => 'Ruangan berhasil ditambahkan',
            'data' => $this->transform($ruangan),
        ], 201);
    }

    public function show($id)
    {
        $ruangan = Ruangan::with(['branch:id,name,code', 'poli:id,kode,nama'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $this->transform($ruangan)]);
    }

    public function update(Request $request, $id)
    {
        $ruangan = Ruangan::findOrFail($id);

        $validated = $request->validate([
            'kode' => [
                'required', 'string', 'max:50',
                Rule::unique('ruangan', 'kode')
                    ->where('poli_id', $ruangan->poli_id)
                    ->ignore($ruangan->id),
            ],
            'nama_ruangan' => 'required|string|max:255',
            'kelas' => 'nullable|string|max:50',
            'kapasitas' => 'nullable|integer|min:1',
            'status' => 'nullable|in:tersedia,terisi,maintenance',
            'keterangan' => 'nullable|string|max:500',
        ]);

        $ruangan->update($validated);
        $ruangan->load(['branch:id,name,code', 'poli:id,kode,nama']);

        return response()->json([
            'success' => true,
            'message' => 'Ruangan berhasil diperbarui',
            'data' => $this->transform($ruangan),
        ]);
    }

    public function destroy($id)
    {
        $ruangan = Ruangan::findOrFail($id);
        $ruangan->delete();
        return response()->json(['success' => true, 'message' => 'Ruangan berhasil dihapus']);
    }

    private function ensurePoliInBranch(int $poliId, int $branchId): void
    {
        $poli = Poli::find($poliId);
        if (! $poli) {
            abort(404, 'Poli tidak ditemukan');
        }
        if ((int) $poli->branch_id !== (int) $branchId) {
            abort(422, 'Poli bukan milik branch ini');
        }
    }

    private function transform(Ruangan $r): array
    {
        return [
            'id' => $r->id,
            'branch_id' => $r->branch_id,
            'poli_id' => $r->poli_id,
            'kode' => $r->kode,
            'namaRuangan' => $r->nama_ruangan,
            'kelas' => $r->kelas,
            'kapasitas' => $r->kapasitas,
            'status' => $r->status,
            'keterangan' => $r->keterangan,
            'poli' => $r->poli ? [
                'id' => $r->poli->id,
                'kode' => $r->poli->kode,
                'nama' => $r->poli->nama,
            ] : null,
            'created_at' => $r->created_at?->toIso8601String(),
            'updated_at' => $r->updated_at?->toIso8601String(),
        ];
    }
}
