<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Asuransi;
use App\Models\Kunjungan;
use App\Models\Nakes;
use App\Models\NursingAssessment;
use App\Models\Pasien;
use App\Models\Poli;
use App\Models\Ruangan;
use App\Models\Ttv;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Validation\Rule;

class KunjunganController extends Controller
{
    /**
     * GET /api/kunjungan
     * Query: branch_id, q, tipe, status, date_from, date_to, pasien_id, limit
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'q' => 'nullable|string|max:200',
            'tipe' => 'nullable|in:rawat_jalan,rawat_inap',
            'status' => 'nullable|in:terdaftar,menunggu,diperiksa,selesai,batal',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'pasien_id' => 'nullable|integer|exists:pasien,id',
            'limit' => 'nullable|integer|min:1|max:500',
        ]);

        $query = Kunjungan::with([
            'pasien:id,no_rm,nama,jenis_kelamin,tanggal_lahir,alamat,nik',
            'poli:id,kode,nama',
            'ruangan:id,kode,nama_ruangan',
            'dokter:id,nama,spesialisasi',
            'dokterPengganti:id,nama',
            'perawat:id,nama',
            'asuransi:id,nama_perusahaan',
            'creator:id,name',
            'kasir:id,name',
            'ttv:id,kunjungan_id,keluhan_utama,suhu,saturasi_oksigen,kesadaran,tinggi_badan,berat_badan,lingkar_perut,imt,sistole,diastole,respiratory_rate,heart_rate,catatan_ttv',
            'nursingAssessment:id,kunjungan_id,subjektif,objektif,asesmen,plan,implementasi,evaluasi',
        ])
            ->forBranch($validated['branch_id'])
            ->ofTipe($validated['tipe'] ?? null)
            ->ofStatus($validated['status'] ?? null)
            ->orderByDesc('tgl_jam_kunjungan');

        if (! empty($validated['pasien_id'])) {
            $query->where('pasien_id', $validated['pasien_id']);
        }

        if (! empty($validated['date_from'])) {
            $query->whereDate('tgl_jam_kunjungan', '>=', $validated['date_from']);
        }
        if (! empty($validated['date_to'])) {
            $query->whereDate('tgl_jam_kunjungan', '<=', $validated['date_to']);
        }

        if (! empty($validated['q'])) {
            $needle = '%' . $validated['q'] . '%';
            $query->where(function ($w) use ($needle) {
                $w->where('no_pendaftaran', 'like', $needle)
                  ->orWhere('penanggung_jawab', 'like', $needle)
                  ->orWhereHas('pasien', function ($p) use ($needle) {
                      $p->where('nama', 'like', $needle)
                        ->orWhere('no_rm', 'like', $needle)
                        ->orWhere('nik', 'like', $needle);
                  });
            });
        }

        $limit = $validated['limit'] ?? 50;
        $items = $query->limit($limit)->get()->map(fn ($k) => $this->transform($k));

        return response()->json(['success' => true, 'data' => $items]);
    }

    /**
     * GET /api/kunjungan/next-nomor?branch_id=&tipe=rawat_jalan
     * Generate nomor pendaftaran harian: REG-YYYYMMDD-XXXX
     */
    public function nextNomor(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'tipe' => 'nullable|in:rawat_jalan,rawat_inap',
        ]);

        $today = now()->format('Ymd');
        $prefix = 'REG-' . $today . '-';

        $last = Kunjungan::withTrashed()
            ->forBranch($validated['branch_id'])
            ->where('no_pendaftaran', 'like', $prefix . '%')
            ->orderByDesc('id')
            ->value('no_pendaftaran');

        $next = 1;
        if ($last && preg_match('/-(\d+)$/', $last, $m)) {
            $next = ((int) $m[1]) + 1;
        }

        $nomor = $prefix . str_pad((string) $next, 4, '0', STR_PAD_LEFT);

        return response()->json([
            'success' => true,
            'data' => ['no_pendaftaran' => $nomor],
        ]);
    }

    /**
     * POST /api/kunjungan
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'branch_id' => 'required|integer|exists:branches,id',
            'pasien_id' => 'required|integer|exists:pasien,id',
            'no_pendaftaran' => [
                'required', 'string', 'max:30',
                Rule::unique('kunjungan', 'no_pendaftaran')->where('branch_id', $request->branch_id),
            ],
            'tipe_kunjungan' => 'required|in:rawat_jalan,rawat_inap',
            'jenis_kunjungan' => 'required|in:baru,lama,kontrol,rujukan,langsung',
            'tgl_jam_kunjungan' => 'required|date',
            'poli_id' => 'nullable|integer|exists:poli,id',
            'ruangan_id' => 'nullable|integer|exists:ruangan,id',
            'dokter_id' => 'nullable|integer|exists:nakes,id',
            'dokter_pengganti_id' => 'nullable|integer|exists:nakes,id',
            'perawat_id' => 'nullable|integer|exists:nakes,id',
            'asuransi_id' => 'nullable|integer|exists:asuransi,id',
            'penanggung_jawab' => 'nullable|string|max:200',
            'hubungan_pj' => 'nullable|string|max:50',
            'nama_perujuk' => 'nullable|string|max:200',
            'no_asuransi' => 'nullable|string|max:100',
            'biaya_pendaftaran' => 'nullable|numeric|min:0',
            'metode_pembayaran' => 'required|in:tunai,asuransi,bpjs,transfer,qris',
            'status_prioritas' => 'required|in:normal,urgent,emergency',
            'skrining_visual' => 'nullable|array',
            'keterangan_skrining' => 'nullable|string',
            'status' => 'nullable|in:terdaftar,menunggu,diperiksa,selesai,batal',
        ]);

        // Pastikan pasien milik branch yang sama
        $pasien = Pasien::find($validated['pasien_id']);
        if (! $pasien || (int) $pasien->branch_id !== (int) $validated['branch_id']) {
            return response()->json([
                'success' => false,
                'message' => 'Pasien bukan milik branch ini',
            ], 422);
        }

        // Validasi konsistensi branch untuk master relasi
        $this->ensureInBranch(Poli::class, $validated['poli_id'] ?? null, $validated['branch_id'], 'Poli');
        $this->ensureInBranch(Ruangan::class, $validated['ruangan_id'] ?? null, $validated['branch_id'], 'Ruangan');
        $this->ensureInBranch(Nakes::class, $validated['dokter_id'] ?? null, $validated['branch_id'], 'Dokter');
        $this->ensureInBranch(Nakes::class, $validated['dokter_pengganti_id'] ?? null, $validated['branch_id'], 'Dokter Pengganti');
        $this->ensureInBranch(Nakes::class, $validated['perawat_id'] ?? null, $validated['branch_id'], 'Perawat');
        $this->ensureInBranch(Asuransi::class, $validated['asuransi_id'] ?? null, $validated['branch_id'], 'Asuransi');

        $validated['biaya_pendaftaran'] = $validated['biaya_pendaftaran'] ?? 0;
        $validated['status'] = $validated['status'] ?? 'terdaftar';
        $validated['created_by'] = Auth::id();

        $kunjungan = DB::transaction(function () use ($validated) {
            $k = Kunjungan::create($validated);
            $k->created_by = Auth::id();
            $k->save();
            return $k;
        });

        $kunjungan->load([
            'pasien:id,no_rm,nama,jenis_kelamin,tanggal_lahir,alamat,nik',
            'poli:id,kode,nama',
            'ruangan:id,kode,nama_ruangan',
            'dokter:id,nama,spesialisasi',
            'dokterPengganti:id,nama',
            'perawat:id,nama',
            'asuransi:id,nama_perusahaan',
            'creator:id,name',
            'kasir:id,name',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kunjungan berhasil didaftarkan',
            'data' => $this->transform($kunjungan),
        ], 201);
    }

    /**
     * GET /api/kunjungan/{id}
     */
    public function show($id)
    {
        $id = $this->decodeId($id);
        $kunjungan = Kunjungan::with([
            'pasien:id,no_rm,nama,jenis_kelamin,tanggal_lahir,alamat,nik,no_hp',
            'poli:id,kode,nama',
            'ruangan:id,kode,nama_ruangan',
            'dokter:id,nama,spesialisasi',
            'dokterPengganti:id,nama',
            'perawat:id,nama',
            'asuransi:id,nama_perusahaan',
            'creator:id,name',
            'kasir:id,name',
            'ttv',
        ])->findOrFail($id);

        $this->ensureBranch($kunjungan);

        return response()->json(['success' => true, 'data' => $this->transform($kunjungan)]);
    }

    /**
     * PUT /api/kunjungan/{id}
     */
    public function update(Request $request, $id)
    {
        $id = $this->decodeId($id);
        $kunjungan = Kunjungan::findOrFail($id);

        $validated = $request->validate([
            'pasien_id' => 'sometimes|integer|exists:pasien,id',
            'tipe_kunjungan' => 'sometimes|in:rawat_jalan,rawat_inap',
            'jenis_kunjungan' => 'sometimes|in:baru,lama,kontrol,rujukan,langsung',
            'tgl_jam_kunjungan' => 'sometimes|date',
            'poli_id' => 'nullable|integer|exists:poli,id',
            'ruangan_id' => 'nullable|integer|exists:ruangan,id',
            'dokter_id' => 'nullable|integer|exists:nakes,id',
            'dokter_pengganti_id' => 'nullable|integer|exists:nakes,id',
            'perawat_id' => 'nullable|integer|exists:nakes,id',
            'asuransi_id' => 'nullable|integer|exists:asuransi,id',
            'penanggung_jawab' => 'nullable|string|max:200',
            'hubungan_pj' => 'nullable|string|max:50',
            'nama_perujuk' => 'nullable|string|max:200',
            'no_asuransi' => 'nullable|string|max:100',
            'biaya_pendaftaran' => 'nullable|numeric|min:0',
            'metode_pembayaran' => 'sometimes|in:tunai,asuransi,bpjs,transfer,qris',
            'status_prioritas' => 'sometimes|in:normal,urgent,emergency',
            'skrining_visual' => 'nullable|array',
            'keterangan_skrining' => 'nullable|string',
            'status' => 'sometimes|in:terdaftar,menunggu,diperiksa,selesai,batal',
        ]);

        $this->ensureInBranch(Poli::class, $validated['poli_id'] ?? null, $kunjungan->branch_id, 'Poli');
        $this->ensureInBranch(Ruangan::class, $validated['ruangan_id'] ?? null, $kunjungan->branch_id, 'Ruangan');
        $this->ensureInBranch(Nakes::class, $validated['dokter_id'] ?? null, $kunjungan->branch_id, 'Dokter');
        $this->ensureInBranch(Nakes::class, $validated['dokter_pengganti_id'] ?? null, $kunjungan->branch_id, 'Dokter Pengganti');
        $this->ensureInBranch(Nakes::class, $validated['perawat_id'] ?? null, $kunjungan->branch_id, 'Perawat');
        $this->ensureInBranch(Asuransi::class, $validated['asuransi_id'] ?? null, $kunjungan->branch_id, 'Asuransi');

        $kunjungan->update($validated);
        $kunjungan->load([
            'pasien:id,no_rm,nama,jenis_kelamin,tanggal_lahir,alamat,nik',
            'poli:id,kode,nama',
            'ruangan:id,kode,nama_ruangan',
            'dokter:id,nama,spesialisasi',
            'dokterPengganti:id,nama',
            'perawat:id,nama',
            'asuransi:id,nama_perusahaan',
            'creator:id,name',
            'kasir:id,name',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kunjungan berhasil diperbarui',
            'data' => $this->transform($kunjungan),
        ]);
    }

    /**
     * DELETE /api/kunjungan/{id}
     */
    public function destroy($id)
    {
        $id = $this->decodeId($id);
        $kunjungan = Kunjungan::findOrFail($id);
        if (in_array($kunjungan->status, ['diperiksa', 'selesai'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Kunjungan yang sudah diperiksa tidak dapat dihapus',
            ], 422);
        }
        $kunjungan->delete();
        return response()->json([
            'success' => true,
            'message' => 'Kunjungan berhasil dihapus',
        ]);
    }

    /**
     * POST /api/kunjungan/{id}/ttv
     * Create-or-update TTV data untuk kunjungan.
     * Jika sudah ada data TTV → update; jika belum → create.
     */
    public function storeTtv(Request $request, $id)
    {
        $id = $this->decodeId($id);
        $kunjungan = Kunjungan::with([
            'pasien:id,no_rm,nama,jenis_kelamin,tanggal_lahir,alamat,nik',
            'poli:id,kode,nama',
            'ruangan:id,kode,nama_ruangan',
            'dokter:id,nama,spesialisasi',
            'dokterPengganti:id,nama',
            'perawat:id,nama',
            'asuransi:id,nama_perusahaan',
            'creator:id,name',
            'kasir:id,name',
        ])->findOrFail($id);

        $this->ensureBranch($kunjungan);

        $validated = $request->validate([
            'keluhan_utama' => 'nullable|string|max:500',
            'suhu' => 'nullable|numeric|between:30,45',
            'saturasi_oksigen' => 'nullable|numeric|between:70,100',
            'kesadaran' => 'nullable|string|max:50',
            'tinggi_badan' => 'nullable|numeric|between:30,300',
            'berat_badan' => 'nullable|numeric|between:1,400',
            'lingkar_perut' => 'nullable|numeric|between:20,400',
            'imt' => 'nullable|numeric|between:10,60',
            'sistole' => 'nullable|integer|between:40,300',
            'diastole' => 'nullable|integer|between:20,200',
            'respiratory_rate' => 'nullable|integer|between:4,80',
            'heart_rate' => 'nullable|integer|between:20,300',
            'catatan_ttv' => 'nullable|string',
        ]);

        Ttv::updateOrCreate(
            ['kunjungan_id' => $kunjungan->id],
            array_merge($validated, ['created_by' => Auth::id()])
        );

        // Update status kunjungan ke 'diperiksa' (jika belum melangkah lebih jauh)
        if (in_array($kunjungan->status, ['terdaftar', 'menunggu'], true)) {
            $kunjungan->update(['status' => 'diperiksa']);
        }

        $kunjungan->load(['pasien', 'poli', 'ruangan', 'dokter', 'dokterPengganti', 'perawat', 'asuransi', 'creator', 'ttv']);

        return response()->json([
            'success' => true,
            'message' => 'Tanda Tanda Vital berhasil disimpan',
            'data' => $this->transform($kunjungan),
        ]);
    }

    /**
     * GET /api/kunjungan/{id}/nursing-assessment
     */
    public function showNursingAssessment($id)
    {
        $id = $this->decodeId($id);
        $kunjungan = Kunjungan::with(['nursingAssessment', 'pasien:id,no_rm,nama,jenis_kelamin,tanggal_lahir,alamat,nik', 'poli:id,nama', 'dokter:id,nama'])
            ->findOrFail($id);

        $this->ensureBranch($kunjungan);

        $na = $kunjungan->nursingAssessment;
        return response()->json([
            'success' => true,
            'data' => $na ? $na->only('id','subjektif','objektif','asesmen','plan','implementasi','evaluasi') + ['created_at' => $na->created_at?->toIso8601String()] : null,
        ]);
    }

    /**
     * POST /api/kunjungan/{id}/nursing-assessment
     * Create-or-update asesmen keperawatan.
     */
    public function storeNursingAssessment(Request $request, $id)
    {
        $id = $this->decodeId($id);
        $kunjungan = Kunjungan::with([
            'pasien:id,no_rm,nama,jenis_kelamin,tanggal_lahir,alamat,nik',
            'poli:id,kode,nama',
            'ruangan:id,kode,nama_ruangan',
            'dokter:id,nama,spesialisasi',
            'dokterPengganti:id,nama',
            'perawat:id,nama',
            'asuransi:id,nama_perusahaan',
            'creator:id,name',
            'kasir:id,name',
            'nursingAssessment',
        ])->findOrFail($id);

        $this->ensureBranch($kunjungan);

        $validated = $request->validate([
            'subjektif' => 'nullable|string',
            'objektif' => 'nullable|string',
            'asesmen' => 'nullable|string',
            'plan' => 'nullable|string',
            'implementasi' => 'nullable|string',
            'evaluasi' => 'nullable|string',
        ]);

        $na = NursingAssessment::updateOrCreate(
            ['kunjungan_id' => $kunjungan->id],
            array_merge($validated, ['created_by' => Auth::id(), 'updated_by' => Auth::id()])
        );

        // Re-load relasi supaya transform() mengembalikan hasNursingAssessment = true
        $kunjungan->load(['pasien', 'poli', 'ruangan', 'dokter', 'dokterPengganti', 'perawat', 'asuransi', 'creator', 'nursingAssessment']);

        return response()->json([
            'success' => true,
            'message' => 'Asesmen Keperawatan berhasil disimpan',
            'data' => $this->transform($kunjungan),
        ]);
    }

    /**
     * Decode encrypted route ID back to numeric (untuk mencegah ID injection).
     * Jika gagal decrypt (misal nilai sudah numerik), kembalikan asli.
     */
    private function decodeId($value)
    {
        try {
            return (int) Crypt::decryptString($value);
        } catch (\Throwable $e) {
            return (int) $value;
        }
    }

    /**
     * Validasi foreign resource milik branch yang sama.
     */
    private function ensureInBranch(string $modelClass, ?int $id, int $branchId, string $label): void
    {
        if (empty($id)) return;
        $row = $modelClass::find($id);
        if (! $row || (int) $row->branch_id !== (int) $branchId) {
            abort(response()->json([
                'success' => false,
                'message' => $label . ' bukan milik branch ini',
            ], 422));
        }
    }

    /**
     * Pastikan kunjungan milik branch yang sedang aktif (security: mencegah IDOR).
     */
    private function ensureBranch(Kunjungan $kunjungan): void
    {
        $user = Auth::user();
        $branchId = $user?->branch_id ?? $kunjungan->branch_id;
        if ((int) $kunjungan->branch_id !== (int) $branchId) {
            abort(response()->json([
                'success' => false,
                'message' => 'Kunjungan bukan milik branch aktif',
            ], 403));
        }
    }

    /**
     * Shape response agar konsisten untuk FE (camelCase).
     */
    private function transform(Kunjungan $k): array
    {
        return [
            'id' => $k->id,
            'encodedId' => Crypt::encryptString((string) $k->id),
            'branch_id' => $k->branch_id,
            'pasien_id' => $k->pasien_id,
            'noPendaftaran' => $k->no_pendaftaran,
            'tipeKunjungan' => $k->tipe_kunjungan,
            'jenisKunjungan' => $k->jenis_kunjungan,
            'tglJamKunjungan' => $k->tgl_jam_kunjungan?->format('Y-m-d H:i:s'),
            'poli_id' => $k->poli_id,
            'ruangan_id' => $k->ruangan_id,
            'dokter_id' => $k->dokter_id,
            'dokter_pengganti_id' => $k->dokter_pengganti_id,
            'perawat_id' => $k->perawat_id,
            'asuransi_id' => $k->asuransi_id,
            'penanggungJawab' => $k->penanggung_jawab,
            'hubunganPj' => $k->hubungan_pj,
            'namaPerujuk' => $k->nama_perujuk,
            'noAsuransi' => $k->no_asuransi,
            'biayaPendaftaran' => (float) $k->biaya_pendaftaran,
            'metodePembayaran' => $k->metode_pembayaran,
            'statusPrioritas' => $k->status_prioritas,
            'skriningVisual' => $k->skrining_visual ?? new \stdClass(),
            'keteranganSkrining' => $k->keterangan_skrining,
            'dataTtv' => $k->ttv ? $k->ttv->only('keluhan_utama','suhu','saturasi_oksigen','kesadaran','tinggi_badan','berat_badan','lingkar_perut','imt','sistole','diastole','respiratory_rate','heart_rate','catatan_ttv') : null,
            'hasTtv' => $k->ttv ? true : false,
            'hasNursingAssessment' => $k->nursingAssessment ? true : false,
            'status' => $k->status,
            'statusBayar' => $k->status_bayar ?? 'belum_bayar',
            'jumlahDibayarkan' => (float) $k->jumlah_dibayarkan,
            'tanggalBayar' => $k->tanggal_bayar?->format('Y-m-d H:i:s'),
            'keteranganBayar' => $k->catatan_bayar,
            'kasirNama' => $k->kasir?->name,
            'created_by' => $k->created_by,
            'pasien' => $k->pasien ? [
                'id' => $k->pasien->id,
                'noRm' => $k->pasien->no_rm,
                'nama' => $k->pasien->nama,
                'jenisKelamin' => $k->pasien->jenis_kelamin,
                'tanggalLahir' => $k->pasien->tanggal_lahir?->format('Y-m-d'),
                'alamat' => $k->pasien->alamat,
                'nik' => $k->pasien->nik,
                'noHp' => $k->pasien->no_hp ?? null,
            ] : null,
            'poli' => $k->poli ? [
                'id' => $k->poli->id,
                'kode' => $k->poli->kode,
                'nama' => $k->poli->nama,
            ] : null,
            'ruangan' => $k->ruangan ? [
                'id' => $k->ruangan->id,
                'kode' => $k->ruangan->kode,
                'namaRuangan' => $k->ruangan->nama_ruangan,
            ] : null,
            'dokter' => $k->dokter ? [
                'id' => $k->dokter->id,
                'nama' => $k->dokter->nama,
                'spesialisasi' => $k->dokter->spesialisasi,
            ] : null,
            'dokterPengganti' => $k->dokterPengganti ? [
                'id' => $k->dokterPengganti->id,
                'nama' => $k->dokterPengganti->nama,
            ] : null,
            'perawat' => $k->perawat ? [
                'id' => $k->perawat->id,
                'nama' => $k->perawat->nama,
            ] : null,
            'asuransi' => $k->asuransi ? [
                'id' => $k->asuransi->id,
                'namaPerusahaan' => $k->asuransi->nama_perusahaan,
            ] : null,
            'created_at' => $k->created_at?->toIso8601String(),
            'updated_at' => $k->updated_at?->toIso8601String(),
        ];
    }
}