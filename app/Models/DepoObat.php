<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DepoObat extends Model
{
    use HasFactory;

    protected $table = 'depo_obat';

    protected $fillable = [
        'branch_id',
        'nama_depo',
        'lokasi',
        'keterangan',
        'status',
    ];

    protected $casts = [
        'branch_id' => 'integer',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'aktif');
    }

    public function scopeForBranch($query, int $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function isActive(): bool
    {
        return $this->status === 'aktif';
    }
}
