<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ObatAlkes;
use App\Models\PenjualanLangsung;
use App\Models\StokMutasi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class PenjualanLangsungController extends Controller
{
    /**
     * GET /api/penjualan-langsung?branch_id=&date_from=&date_to=&q=&limit
     * Riwayat penjualan obat langsung (OTC), di-scope branch aktif.
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'q' => 'nullable|string|max:200',
            'limit' => 'nullable|integer|min:1|max:500',
        ]);

        $query = PenjualanLangsung::with(['obatAlkes:id,nama', 'kasir:id,name'])
            ->forBranch((int) $validated['branch_id'])
            ->orderByDesc('created_at');

        if (! empty($validated['date_from'])) $query->whereDate('created_at', '>=', $validated['date_from']);
        if (! empty($validated['date_to'])) $query->whereDate('created_at', '<=', $validated['date_to']);

        if (! empty($validated['q'])) {
            $needle = '%' . $validated['q'] . '%';
            $query->where('no_transaksi', 'like', $needle)->orWhere('nama_obat', 'like', $needle);
        }

        $items = $query->limit($validated['limit'] ?? 200)->get()->map(fn ($p) => [
            'id' => $p->id,
            'noTransaksi' => $p->no_transaksi,
            'namaObat' => $p->nama_obat,
            'qty' => $p->qty,
            'hargaSatuan' => (int) $p->harga_satuan,
            'total' => (int) $p->total,
            'metodePembayaran' => $p->metode_pembayaran,
            'keterangan' => $p->keterangan,
            'kasirNama' => $p->kasir?->name,
            'createdAt' => $p->created_at?->toIso8601String(),
        ]);

        return response()->json(['success' => true, 'data' => $items]);
    }

    /**
     * GET /api/penjualan-langsung/next-nomor?branch_id=
     */
    public function nextNomor(Request $request)
    {
        $validated = $request->validate(['branch_id' => 'required|integer|exists:branches,id']);

        $today = now()->format('Ymd');
        $prefix = 'OTC-' . $today . '-';
        $last = PenjualanLangsung::forBranch((int) $validated['branch_id'])
            ->where('no_transaksi', 'like', $prefix . '%')
            ->orderByDesc('id')->value('no_transaksi');

        $next = 1;
        if ($last && preg_match('/-(\d+)$/', $last, $m)) $next = ((int) $m[1]) + 1;

        return response()->json(['success' => true, 'data' => ['no_transaksi' => $prefix . str_pad((string) $next, 4, '0', STR_PAD_LEFT)]]);
    }

    /**
     * POST /api/penjualan-langsung
     * Body: branch_id, obat_alkes_id, qty, metode_pembayaran, keterangan?
     * Mengurangi stok obat + mencatat mutasi + total otomatis dari harga_jual.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'obat_alkes_id' => 'required|integer|exists:obat_alkes,id',
            'qty' => 'required|integer|min:1',
            'metode_pembayaran' => 'required|in:tunai,qris,transfer',
            'keterangan' => 'nullable|string|max:500',
        ]);

        $branchId = (int) $validated['branch_id'];
        $obat = ObatAlkes::forBranch($branchId)->findOrFail($validated['obat_alkes_id']);

        $qty = (int) $validated['qty'];
        if ($qty > (int) $obat->stok) {
            return response()->json(['success' => false, 'message' => 'Stok tidak cukup (tersedia ' . (int) $obat->stok . ')'], 422);
        }

        $harga = (int) $obat->harga_jual;
        $total = $harga * $qty;

        $nomor = $this->nextNomor($request)->getData(true)['data']['no_transaksi'];

        DB::transaction(function () use ($branchId, $obat, $validated, $qty, $harga, $total, $nomor) {
            $stokSebelum = (int) $obat->stok;
            $obat->decrement('stok', $qty);

            PenjualanLangsung::create([
                'branch_id' => $branchId,
                'no_transaksi' => $nomor,
                'obat_alkes_id' => $obat->id,
                'nama_obat' => $obat->nama,
                'qty' => $qty,
                'harga_satuan' => $harga,
                'total' => $total,
                'metode_pembayaran' => $validated['metode_pembayaran'],
                'keterangan' => $validated['keterangan'] ?? null,
                'kasir_id' => Auth::id(),
            ]);

            StokMutasi::create([
                'branch_id' => $branchId,
                'obat_alkes_id' => $obat->id,
                'tipe' => 'keluar',
                'qty' => $qty,
                'stok_sebelum' => $stokSebelum,
                'stok_sesudah' => $stokSebelum - $qty,
                'harga_satuan' => $harga,
                'ref_type' => 'penjualan_langsung',
                'ref_id' => $obat->id,
                'keterangan' => 'Penjualan langsung ' . $nomor . ' — ' . $obat->nama,
                'created_by' => Auth::id(),
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Penjualan langsung berhasil: ' . $obat->nama . ' x' . $qty . ' = Rp' . number_format($total, 0, ',', '.'),
            'data' => ['no_transaksi' => $nomor, 'total' => $total],
        ], 201);
    }
}
