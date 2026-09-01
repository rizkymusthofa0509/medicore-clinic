<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ObatAlkes extends Model
{
    use HasFactory;

    protected $table = 'obat_alkes';

    protected $fillable = [
        'branch_id',
        'kategori',
        'nama',
        'kode_kfa',
        'satuan_terbesar',
        'satuan_terkecil',
        'jumlah_per_satuan_terbesar',
        'harga_jual',
        'stok',
        'alamat',
        'no_telp',
        'email',
        'status',
    ];

    protected $casts = [
        'branch_id' => 'integer',
        'jumlah_per_satuan_terbesar' => 'integer',
        'harga_jual' => 'integer',
        'stok' => 'integer',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function scopeForBranch($query, int $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeOfKategori($query, string $kategori)
    {
        return $query->where('kategori', $kategori);
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
