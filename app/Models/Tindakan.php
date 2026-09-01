<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Tindakan extends Model
{
    use HasFactory;

    protected $table = 'tindakan';

    protected $fillable = [
        'branch_id',
        'poli_id',
        'kelompok_tindakan',
        'kode_icd9',
        'nama_tindakan',
        'jumlah_biaya',
        'jasa_dokter',
        'persentase_dokter',
        'rupiah_dokter',
        'jasa_asisten',
        'persentase_asisten',
        'rupiah_asisten',
        'jasa_klinik',
        'persentase_klinik',
        'rupiah_klinik',
        'status',
    ];

    protected $casts = [
        'branch_id' => 'integer',
        'poli_id' => 'integer',
        'jumlah_biaya' => 'integer',
        'jasa_dokter' => 'integer',
        'persentase_dokter' => 'integer',
        'rupiah_dokter' => 'integer',
        'jasa_asisten' => 'integer',
        'persentase_asisten' => 'integer',
        'rupiah_asisten' => 'integer',
        'jasa_klinik' => 'integer',
        'persentase_klinik' => 'integer',
        'rupiah_klinik' => 'integer',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function poli(): BelongsTo
    {
        return $this->belongsTo(Poli::class);
    }

    public function scopeForBranch($query, int $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'aktif');
    }

    public function isActive(): bool
    {
        return $this->status === 'aktif';
    }
}
