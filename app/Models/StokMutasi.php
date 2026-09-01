<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StokMutasi extends Model
{
    use HasFactory;

    protected $table = 'stok_mutasi';

    protected $fillable = [
        'branch_id',
        'obat_alkes_id',
        'tipe',
        'qty',
        'stok_sebelum',
        'stok_sesudah',
        'harga_satuan',
        'ref_type',
        'ref_id',
        'keterangan',
        'created_by',
    ];

    protected $casts = [
        'qty' => 'integer',
        'stok_sebelum' => 'integer',
        'stok_sesudah' => 'integer',
        'harga_satuan' => 'integer',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function obatAlkes(): BelongsTo
    {
        return $this->belongsTo(ObatAlkes::class);
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
