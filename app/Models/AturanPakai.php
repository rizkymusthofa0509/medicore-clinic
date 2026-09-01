<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AturanPakai extends Model
{
    use HasFactory;

    protected $table = 'aturan_pakai';

    protected $fillable = [
        'branch_id',
        'aturan',
        'status_aktif',
    ];

    protected $casts = [
        'branch_id' => 'integer',
        'status_aktif' => 'boolean',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function scopeForBranch($query, int $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeActive($query)
    {
        return $query->where('status_aktif', true);
    }

    public function isActive(): bool
    {
        return (bool) $this->status_aktif;
    }
}
