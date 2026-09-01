<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pasien;
use App\Models\UnitLokasi;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PasienController extends Controller
{
    /**
     * GET /api/pasien?branch_id=1&q=keyword
     * Pencarian pasien per branch dengan keyword (nama / no_rm / nik).
     */
    public function index(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'q' => 'nullable|string|max:200',
        ]);

        $pasien = Pasien::with(['branch:id,name,code', 'unitLokasi:id,kode,nama_unit'])
            ->forBranch($request->branch_id)
            ->search($request->q)
            ->orderByDesc('id')
            ->limit(100)
            ->get()
            ->map(fn ($p) => $this->transform($p));

        return response()->json(['success' => true, 'data' => $pasien]);
    }

    /**
     * GET /api/pasien/next-rm?branch_id=1
     * Mengirim No RM berikutnya yang tersedia untuk branch.
     */
    public function nextRm(Request $request)
    {
        $request->validate(['branch_id' => 'required|integer|exists:branches,id']);

        $last = Pasien::forBranch($request->branch_id)
            ->where('no_rm', 'like', 'RM-%')
            ->orderByDesc('id')
            ->first();

        $next = 1;
        if ($last && preg_match('/RM-(\d+)/', $last->no_rm, $m)) {
            $next = ((int) $m[1]) + 1;
        }

        return response()->json([
            'success' => true,
            'data' => ['no_rm' => 'RM-' . str_pad((string) $next, 6, '0', STR_PAD_LEFT)],
        ]);
    }

    /**
     * POST /api/pasien
     * Catat pasien baru.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'unit_lokasi_id' => 'nullable|integer|exists:unit_lokasi,id',
            'no_rm' => [
                'required', 'string', 'max:30',
                Rule::unique('pasien', 'no_rm')->where('branch_id', $request->branch_id),
            ],
            'no_rm_lama' => 'nullable|string|max:50',
            'jenis_identitas' => 'required|in:KTP,SIM,Paspot,Kartu Keluarga,Tanpa Identitas',
            'nik' => [
                'nullable', 'string', 'max:20',
                // NIK harus 16 digit ATAU kosong (untuk Tanpa Identitas)
                function ($attr, $value, $fail) use ($request) {
                    if ($request->jenis_identitas === 'Tanpa Identitas') return;
                    if ($value && strlen(preg_replace('/\D/', '', $value)) !== 16) {
                        $fail('NIK harus 16 digit');
                    }
                },
            ],
            'satusehat_id' => 'nullable|string|max:50',
            'gelar' => 'nullable|string|max:30',
            'nama' => 'required|string|max:200',
            'tempat_lahir' => 'required|string|max:100',
            'tanggal_lahir' => 'required|date',
            'jenis_kelamin' => 'required|in:L,P',
            'golongan_darah' => 'nullable|in:A,B,AB,O',
            'agama' => 'nullable|string|max:30',
            'pendidikan' => 'nullable|string|max:30',
            'pekerjaan' => 'nullable|string|max:100',
            'alamat' => 'nullable|string',
            'rt' => 'nullable|string|max:5',
            'rw' => 'nullable|string|max:5',
            'nama_desa' => 'nullable|string|max:100',
            'alamat_ktp_berbeda' => 'nullable|boolean',
            'alamat_ktp' => 'nullable|string',
            'rt_ktp' => 'nullable|string|max:5',
            'rw_ktp' => 'nullable|string|max:5',
            'desa_ktp' => 'nullable|string|max:100',
            'no_hp' => 'nullable|string|max:20',
        ]);

        // Pastikan unit_lokasi_id berada di branch yang sama
        if (!empty($validated['unit_lokasi_id'])) {
            $unit = UnitLokasi::find($validated['unit_lokasi_id']);
            if (! $unit || (int) $unit->branch_id !== (int) $validated['branch_id']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unit lokasi bukan milik branch ini',
                ], 422);
            }
        }

        $pasien = Pasien::create($validated)
            ->load(['branch:id,name,code', 'unitLokasi:id,kode,nama_unit']);

        return response()->json([
            'success' => true,
            'message' => 'Pasien berhasil didaftarkan',
            'data' => $this->transform($pasien),
        ], 201);
    }

    public function show($id)
    {
        $pasien = Pasien::with(['branch:id,name,code', 'unitLokasi:id,kode,nama_unit'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => $this->transform($pasien)]);
    }

    public function update(Request $request, $id)
    {
        $pasien = Pasien::findOrFail($id);

        $validated = $request->validate([
            'unit_lokasi_id' => 'nullable|integer|exists:unit_lokasi,id',
            'no_rm' => [
                'sometimes', 'string', 'max:30',
                Rule::unique('pasien', 'no_rm')
                    ->where('branch_id', $pasien->branch_id)
                    ->ignore($pasien->id),
            ],
            'no_rm_lama' => 'nullable|string|max:50',
            'jenis_identitas' => 'sometimes|in:KTP,SIM,Paspot,Kartu Keluarga,Tanpa Identitas',
            'nik' => 'nullable|string|max:20',
            'satusehat_id' => 'nullable|string|max:50',
            'gelar' => 'nullable|string|max:30',
            'nama' => 'sometimes|string|max:200',
            'tempat_lahir' => 'sometimes|string|max:100',
            'tanggal_lahir' => 'sometimes|date',
            'jenis_kelamin' => 'sometimes|in:L,P',
            'golongan_darah' => 'nullable|in:A,B,AB,O',
            'agama' => 'nullable|string|max:30',
            'pendidikan' => 'nullable|string|max:30',
            'pekerjaan' => 'nullable|string|max:100',
            'alamat' => 'nullable|string',
            'rt' => 'nullable|string|max:5',
            'rw' => 'nullable|string|max:5',
            'nama_desa' => 'nullable|string|max:100',
            'alamat_ktp_berbeda' => 'nullable|boolean',
            'alamat_ktp' => 'nullable|string',
            'rt_ktp' => 'nullable|string|max:5',
            'rw_ktp' => 'nullable|string|max:5',
            'desa_ktp' => 'nullable|string|max:100',
            'no_hp' => 'nullable|string|max:20',
        ]);

        if (array_key_exists('unit_lokasi_id', $validated) && $validated['unit_lokasi_id'] !== null) {
            $unit = UnitLokasi::find($validated['unit_lokasi_id']);
            if (! $unit || (int) $unit->branch_id !== (int) $pasien->branch_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unit lokasi bukan milik branch ini',
                ], 422);
            }
        }

        $pasien->update($validated);
        $pasien->load(['branch:id,name,code', 'unitLokasi:id,kode,nama_unit']);

        return response()->json([
            'success' => true,
            'message' => 'Data pasien berhasil diperbarui',
            'data' => $this->transform($pasien),
        ]);
    }

    public function destroy($id)
    {
        $pasien = Pasien::findOrFail($id);
        $pasien->delete();
        return response()->json(['success' => true, 'message' => 'Pasien berhasil dihapus']);
    }

    private function transform(Pasien $p): array
    {
        return [
            'id' => $p->id,
            'branch_id' => $p->branch_id,
            'unitLokasiId' => $p->unit_lokasi_id,
            'noRm' => $p->no_rm,
            'noRmLama' => $p->no_rm_lama,
            'jenisIdentitas' => $p->jenis_identitas,
            'nik' => $p->nik,
            'satusehatId' => $p->satusehat_id,
            'gelar' => $p->gelar,
            'nama' => $p->nama,
            'tempatLahir' => $p->tempat_lahir,
            'tanggalLahir' => $p->tanggal_lahir?->format('Y-m-d'),
            'jenisKelamin' => $p->jenis_kelamin,
            'golonganDarah' => $p->golongan_darah,
            'agama' => $p->agama,
            'pendidikan' => $p->pendidikan,
            'pekerjaan' => $p->pekerjaan,
            'alamat' => $p->alamat,
            'rt' => $p->rt,
            'rw' => $p->rw,
            'namaDesa' => $p->nama_desa,
            'alamatKtpBerbeda' => (bool) $p->alamat_ktp_berbeda,
            'alamatKtp' => $p->alamat_ktp,
            'rtKtp' => $p->rt_ktp,
            'rwKtp' => $p->rw_ktp,
            'desaKtp' => $p->desa_ktp,
            'noHp' => $p->no_hp,
            'unitLokasi' => $p->unitLokasi ? [
                'id' => $p->unitLokasi->id,
                'kode' => $p->unitLokasi->kode,
                'namaUnit' => $p->unitLokasi->nama_unit,
            ] : null,
            'branch' => $p->branch ? [
                'id' => $p->branch->id,
                'name' => $p->branch->name,
                'code' => $p->branch->code,
            ] : null,
            'created_at' => $p->created_at?->toIso8601String(),
            'updated_at' => $p->updated_at?->toIso8601String(),
        ];
    }
}
