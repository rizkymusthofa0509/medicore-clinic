<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PemeriksaanDokter extends Model
{
    use HasFactory;

    protected $table = 'pemeriksaan_dokter';

    protected $fillable = [
        'branch_id',
        'kunjungan_id',
        'pasien_id',
        'poli_id',
        'dokter_id',
        'status',
        'registrasi',
        'ttv',
        'pemeriksaan_fisik',
        'anatomi',
        'riwayat_alergi',
        'riwayat_obat',
        'riwayat_penyakit',
        'diagnosa',
        'pemberian_obat',
        'pemberian_obat_racik',
        'pemberian_tindakan',
        'status_farmasi',
        'catatan_farmasi',
        'catatan',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'registrasi' => 'array',
        'ttv' => 'array',
        'pemeriksaan_fisik' => 'array',
        'anatomi' => 'array',
        'riwayat_alergi' => 'array',
        'riwayat_obat' => 'array',
        'riwayat_penyakit' => 'array',
        'diagnosa' => 'array',
        'pemberian_obat' => 'array',
        'pemberian_obat_racik' => 'array',
        'pemberian_tindakan' => 'array',
        'catatan' => 'array',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function kunjungan(): BelongsTo
    {
        return $this->belongsTo(Kunjungan::class);
    }

    public function pasien(): BelongsTo
    {
        return $this->belongsTo(Pasien::class);
    }

    public function poli(): BelongsTo
    {
        return $this->belongsTo(Poli::class);
    }

    public function dokter(): BelongsTo
    {
        return $this->belongsTo(Nakes::class, 'dokter_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeForBranch($query, int $branchId)
    {
        return $query->where('branch_id', $branchId);
    }
}
