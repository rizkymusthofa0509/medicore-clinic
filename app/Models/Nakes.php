<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Nakes extends Model
{
    use HasFactory;

    protected $table = 'nakes';

    protected $fillable = [
        'branch_id',
        'nama',
        'nik',
        'email',
        'tipe',
        'no_str',
        'no_sip',
        'str_expired_at',
        'sip_expired_at',
        'kode_bpjs',
        'ihs_satusehat',
        'spesialisasi',
        'no_telp',
        'status',
    ];

    protected $casts = [
        'branch_id' => 'integer',
        'str_expired_at' => 'date',
        'sip_expired_at' => 'date',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function polis(): BelongsToMany
    {
        return $this->belongsToMany(Poli::class, 'nakes_poli', 'nakes_id', 'poli_id')
            ->withTimestamps();
    }

    public function scopeForBranch($query, int $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeOfType($query, string $tipe)
    {
        return $query->where('tipe', $tipe);
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
