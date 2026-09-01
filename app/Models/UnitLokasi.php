<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class UnitLokasi extends Model
{
    use HasFactory;

    protected $table = 'unit_lokasi';

    protected $fillable = [
        'branch_id',
        'kode',
        'nama_unit',
        'jenis',
        'lokasi',
        'keterangan',
        'status',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function polis(): HasMany
    {
        return $this->hasMany(Poli::class);
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
