<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Nakes;
use App\Models\Poli;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class NakesController extends Controller
{
    /**
     * GET /api/nakes?branch_id=1&tipe=dokter
     */
    public function index(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'tipe' => 'nullable|in:dokter,perawat,bidan,analis_lab',
            'q' => 'nullable|string|max:200',
        ]);

        $query = Nakes::with(['branch:id,name,code', 'polis:id,kode,nama'])
            ->forBranch($request->branch_id)
            ->orderBy('nama');

        if ($request->filled('tipe')) {
            $query->where('tipe', $request->tipe);
        }

        if ($request->filled('q')) {
            $query->where('nama', 'like', '%' . $request->q . '%')->limit(25);
        }

        $items = $query->get()->map(fn ($n) => $this->transform($n));

        return response()->json(['success' => true, 'data' => $items]);
    }

    /**
     * POST /api/nakes
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'nama' => 'required|string|max:255',
            'nik' => [
                'required', 'string', 'max:32',
                Rule::unique('nakes', 'nik')->where('branch_id', $request->branch_id),
            ],
            'email' => 'nullable|email|max:255',
            'tipe' => 'required|in:dokter,perawat,bidan,analis_lab',
            'no_str' => 'nullable|string|max:100',
            'no_sip' => 'nullable|string|max:100',
            'str_expired_at' => 'nullable|date',
            'sip_expired_at' => 'nullable|date',
            'kode_bpjs' => 'nullable|string|max:50',
            'ihs_satusehat' => 'nullable|string|max:100',
            'spesialisasi' => 'nullable|string|max:100',
            'no_telp' => 'nullable|string|max:32',
            'status' => 'nullable|in:aktif,nonaktif',
            'poli_ids' => 'nullable|array',
            'poli_ids.*' => 'integer|exists:poli,id',
        ]);

        $poliIds = $validated['poli_ids'] ?? [];
        unset($validated['poli_ids']);

        $this->ensurePolisInBranch($poliIds, $validated['branch_id']);

        $nakes = Nakes::create(array_merge($validated, [
            'status' => $validated['status'] ?? 'aktif',
        ]));

        if (!empty($poliIds)) {
            $nakes->polis()->sync($poliIds);
        }

        $nakes->load(['branch:id,name,code', 'polis:id,kode,nama']);

        return response()->json([
            'success' => true,
            'message' => 'Nakes berhasil ditambahkan',
            'data' => $this->transform($nakes),
        ], 201);
    }

    /**
     * GET /api/nakes/{id}
     */
    public function show($id)
    {
        $nakes = Nakes::with(['branch:id,name,code', 'polis:id,kode,nama'])->findOrFail($id);

        return response()->json(['success' => true, 'data' => $this->transform($nakes)]);
    }

    /**
     * PUT /api/nakes/{id}
     */
    public function update(Request $request, $id)
    {
        $nakes = Nakes::findOrFail($id);

        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'nik' => [
                'required', 'string', 'max:32',
                Rule::unique('nakes', 'nik')
                    ->where('branch_id', $nakes->branch_id)
                    ->ignore($nakes->id),
            ],
            'email' => 'nullable|email|max:255',
            'tipe' => 'required|in:dokter,perawat,bidan,analis_lab',
            'no_str' => 'nullable|string|max:100',
            'no_sip' => 'nullable|string|max:100',
            'str_expired_at' => 'nullable|date',
            'sip_expired_at' => 'nullable|date',
            'kode_bpjs' => 'nullable|string|max:50',
            'ihs_satusehat' => 'nullable|string|max:100',
            'spesialisasi' => 'nullable|string|max:100',
            'no_telp' => 'nullable|string|max:32',
            'status' => 'nullable|in:aktif,nonaktif',
            'poli_ids' => 'nullable|array',
            'poli_ids.*' => 'integer|exists:poli,id',
        ]);

        $poliIds = $validated['poli_ids'] ?? null;
        unset($validated['poli_ids']);

        $this->ensurePolisInBranch($poliIds ?? [], $nakes->branch_id);

        $nakes->update($validated);

        if ($poliIds !== null) {
            $nakes->polis()->sync($poliIds);
        }

        $nakes->load(['branch:id,name,code', 'polis:id,kode,nama']);

        return response()->json([
            'success' => true,
            'message' => 'Nakes berhasil diperbarui',
            'data' => $this->transform($nakes),
        ]);
    }

    /**
     * DELETE /api/nakes/{id}
     */
    public function destroy($id)
    {
        $nakes = Nakes::findOrFail($id);
        $nakes->delete();

        return response()->json([
            'success' => true,
            'message' => 'Nakes berhasil dihapus',
        ]);
    }

    private function ensurePolisInBranch(array $poliIds, int $branchId): void
    {
        if (empty($poliIds)) return;

        $count = Poli::whereIn('id', $poliIds)
            ->where('branch_id', $branchId)
            ->count();

        if ($count !== count($poliIds)) {
            abort(422, 'Satu atau lebih poli bukan milik branch ini');
        }
    }

    /**
     * Shape response agar konsisten untuk FE.
     * Field camelCase: noSTR, noSIP, kodeBpjs, ihsSatusehat, strExpiredAt, sipExpiredAt.
     * Relasi polis[] dan poliIds[] untuk kebutuhan UI multi-select.
     */
    private function transform(Nakes $n): array
    {
        return [
            'id' => $n->id,
            'branch_id' => $n->branch_id,
            'nama' => $n->nama,
            'nik' => $n->nik,
            'email' => $n->email,
            'tipe' => $n->tipe,
            'noSTR' => $n->no_str,
            'noSIP' => $n->no_sip,
            'strExpiredAt' => $n->str_expired_at?->toDateString(),
            'sipExpiredAt' => $n->sip_expired_at?->toDateString(),
            'kodeBpjs' => $n->kode_bpjs,
            'ihsSatusehat' => $n->ihs_satusehat,
            'spesialisasi' => $n->spesialisasi,
            'noTelp' => $n->no_telp,
            'status' => $n->status,
            'polis' => $n->polis->map(fn ($p) => [
                'id' => $p->id,
                'kode' => $p->kode,
                'nama' => $p->nama,
            ])->values(),
            'poliIds' => $n->polis->pluck('id')->values(),
            'branch' => $n->branch ? [
                'id' => $n->branch->id,
                'name' => $n->branch->name,
                'code' => $n->branch->code,
            ] : null,
            'created_at' => $n->created_at?->toIso8601String(),
            'updated_at' => $n->updated_at?->toIso8601String(),
        ];
    }
}
