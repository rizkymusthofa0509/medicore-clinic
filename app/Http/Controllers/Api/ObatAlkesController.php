<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ObatAlkes;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ObatAlkesController extends Controller
{
    /**
     * GET /api/obat-alkes?branch_id=1&kategori=obat
     */
    public function index(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'kategori' => 'nullable|in:obat,alkes,pbf',
            'q' => 'nullable|string|max:200',
        ]);

        $query = ObatAlkes::with('branch:id,name,code')
            ->forBranch($request->branch_id)
            ->orderBy('kategori')
            ->orderBy('nama');

        if ($request->filled('kategori')) {
            $query->where('kategori', $request->kategori);
        }

        if ($request->filled('q')) {
            $needle = '%' . $request->q . '%';
            $query->where(function ($w) use ($needle) {
                $w->where('nama', 'like', $needle)
                  ->orWhere('kode_kfa', 'like', $needle);
            })->limit(25);
        }

        $items = $query->get()->map(fn ($o) => $this->transform($o));

        return response()->json(['success' => true, 'data' => $items]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'kategori' => 'required|in:obat,alkes,pbf',
            'nama' => 'required|string|max:255',
            'kode_kfa' => [
                'nullable', 'string', 'max:50',
                Rule::unique('obat_alkes', 'kode_kfa')->where('branch_id', $request->branch_id),
            ],
            'satuan_terbesar' => 'nullable|string|max:50',
            'satuan_terkecil' => 'nullable|string|max:50',
            'jumlah_per_satuan_terbesar' => 'nullable|integer|min:1',
            'harga_jual' => 'nullable|integer|min:0',
            'stok' => 'nullable|integer|min:0',
            'alamat' => 'nullable|string|max:500',
            'no_telp' => 'nullable|string|max:32',
            'email' => 'nullable|email|max:255',
            'status' => 'nullable|in:aktif,nonaktif',
        ]);

        $item = ObatAlkes::create(array_merge($validated, [
            'status' => $validated['status'] ?? 'aktif',
        ]))->load('branch:id,name,code');

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil ditambahkan',
            'data' => $this->transform($item),
        ], 201);
    }

    public function show($id)
    {
        $item = ObatAlkes::with('branch:id,name,code')->findOrFail($id);

        return response()->json(['success' => true, 'data' => $this->transform($item)]);
    }

    public function update(Request $request, $id)
    {
        $item = ObatAlkes::findOrFail($id);

        $validated = $request->validate([
            'kategori' => 'required|in:obat,alkes,pbf',
            'nama' => 'required|string|max:255',
            'kode_kfa' => [
                'nullable', 'string', 'max:50',
                Rule::unique('obat_alkes', 'kode_kfa')
                    ->where('branch_id', $item->branch_id)
                    ->ignore($item->id),
            ],
            'satuan_terbesar' => 'nullable|string|max:50',
            'satuan_terkecil' => 'nullable|string|max:50',
            'jumlah_per_satuan_terbesar' => 'nullable|integer|min:1',
            'harga_jual' => 'nullable|integer|min:0',
            'stok' => 'nullable|integer|min:0',
            'alamat' => 'nullable|string|max:500',
            'no_telp' => 'nullable|string|max:32',
            'email' => 'nullable|email|max:255',
            'status' => 'nullable|in:aktif,nonaktif',
        ]);

        $item->update($validated);
        $item->load('branch:id,name,code');

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil diperbarui',
            'data' => $this->transform($item),
        ]);
    }

    public function destroy($id)
    {
        $item = ObatAlkes::findOrFail($id);
        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data berhasil dihapus',
        ]);
    }

    private function transform(ObatAlkes $o): array
    {
        return [
            'id' => $o->id,
            'branch_id' => $o->branch_id,
            'kategori' => $o->kategori,
            'nama' => $o->nama,
            'kodeKfa' => $o->kode_kfa,
            'satuanTerbesar' => $o->satuan_terbesar,
            'satuanTerkecil' => $o->satuan_terkecil,
            'jumlahPerSatuanTerbesar' => $o->jumlah_per_satuan_terbesar,
            'hargaJual' => (int) $o->harga_jual,
            'stok' => (int) $o->stok,
            'alamat' => $o->alamat,
            'noTelp' => $o->no_telp,
            'email' => $o->email,
            'status' => $o->status,
            'branch' => $o->branch ? [
                'id' => $o->branch->id,
                'name' => $o->branch->name,
                'code' => $o->branch->code,
            ] : null,
            'created_at' => $o->created_at?->toIso8601String(),
            'updated_at' => $o->updated_at?->toIso8601String(),
        ];
    }
}
