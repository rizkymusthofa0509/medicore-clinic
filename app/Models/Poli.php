<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Poli extends Model
{
    use HasFactory;

    protected $table = 'poli';

    protected $fillable = [
        'branch_id',
        'unit_lokasi_id',
        'depo_obat_id',
        'kode',
        'nama',
        'jenis_poli',
        'antrian_ftkp',
        'status',
    ];

    protected $casts = [
        'antrian_ftkp' => 'boolean',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function unitLokasi(): BelongsTo
    {
        return $this->belongsTo(UnitLokasi::class);
    }

    public function depoObat(): BelongsTo
    {
        return $this->belongsTo(DepoObat::class);
    }

    public function ruangans(): HasMany
    {
        return $this->hasMany(Ruangan::class);
    }

    public function scopeForBranch($query, int $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'aktif');
    }
}
