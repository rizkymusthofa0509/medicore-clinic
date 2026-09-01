<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pasien extends Model
{
    use HasFactory;

    protected $table = 'pasien';

    protected $fillable = [
        'branch_id',
        'unit_lokasi_id',
        'no_rm',
        'no_rm_lama',
        'jenis_identitas',
        'nik',
        'satusehat_id',
        'gelar',
        'nama',
        'tempat_lahir',
        'tanggal_lahir',
        'jenis_kelamin',
        'golongan_darah',
        'agama',
        'pendidikan',
        'pekerjaan',
        'alamat',
        'rt',
        'rw',
        'nama_desa',
        'alamat_ktp_berbeda',
        'alamat_ktp',
        'rt_ktp',
        'rw_ktp',
        'desa_ktp',
        'no_hp',
    ];

    protected $casts = [
        'tanggal_lahir' => 'date',
        'alamat_ktp_berbeda' => 'boolean',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function unitLokasi(): BelongsTo
    {
        return $this->belongsTo(UnitLokasi::class);
    }

    public function scopeForBranch($query, int $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeSearch($query, ?string $q)
    {
        if (! $q) return $query;
        $needle = '%' . $q . '%';
        return $query->where(function ($w) use ($needle) {
            $w->where('nama', 'like', $needle)
              ->orWhere('no_rm', 'like', $needle)
              ->orWhere('no_rm_lama', 'like', $needle)
              ->orWhere('nik', 'like', $needle);
        });
    }
}
