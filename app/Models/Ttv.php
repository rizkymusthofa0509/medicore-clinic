<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Ttv extends Model
{
    use HasFactory;

    protected $table = 'ttv';

    protected $fillable = [
        'kunjungan_id',
        'keluhan_utama',
        'suhu',
        'saturasi_oksigen',
        'kesadaran',
        'tinggi_badan',
        'berat_badan',
        'lingkar_perut',
        'imt',
        'sistole',
        'diastole',
        'respiratory_rate',
        'heart_rate',
        'catatan_ttv',
        'created_by',
    ];

    protected $casts = [
        'suhu' => 'decimal:2',
        'saturasi_oksigen' => 'decimal:2',
        'tinggi_badan' => 'decimal:2',
        'berat_badan' => 'decimal:2',
        'lingkar_perut' => 'decimal:2',
        'imt' => 'decimal:2',
    ];

    public function kunjungan(): BelongsTo
    {
        return $this->belongsTo(Kunjungan::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
