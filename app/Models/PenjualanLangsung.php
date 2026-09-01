<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PenjualanLangsung extends Model
{
    use HasFactory;

    protected $table = 'penjualan_langsung';

    protected $fillable = [
        'branch_id',
        'no_transaksi',
        'obat_alkes_id',
        'nama_obat',
        'qty',
        'harga_satuan',
        'total',
        'metode_pembayaran',
        'keterangan',
        'kasir_id',
    ];

    protected $casts = [
        'qty' => 'integer',
        'harga_satuan' => 'integer',
        'total' => 'integer',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function obatAlkes(): BelongsTo
    {
        return $this->belongsTo(ObatAlkes::class);
    }

    public function kasir(): BelongsTo
    {
        return $this->belongsTo(User::class, 'kasir_id');
    }

    public function scopeForBranch($query, int $branchId)
    {
        return $query->where('branch_id', $branchId);
    }
}
