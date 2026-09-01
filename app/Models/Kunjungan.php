<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Kunjungan extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'kunjungan';

    protected $fillable = [
        'branch_id',
        'pasien_id',
        'no_pendaftaran',
        'tipe_kunjungan',
        'jenis_kunjungan',
        'tgl_jam_kunjungan',
        'poli_id',
        'ruangan_id',
        'dokter_id',
        'dokter_pengganti_id',
        'perawat_id',
        'asuransi_id',
        'penanggung_jawab',
        'hubungan_pj',
        'nama_perujuk',
        'no_asuransi',
        'biaya_pendaftaran',
        'metode_pembayaran',
        'status_prioritas',
        'skrining_visual',
        'keterangan_skrining',
        'status',
        'status_bayar',
        'jumlah_dibayarkan',
        'catatan_bayar',
        'tanggal_bayar',
        'kasir_id',
        'created_by',
    ];

    protected $casts = [
        'tgl_jam_kunjungan' => 'datetime',
        'skrining_visual' => 'array',
        'biaya_pendaftaran' => 'decimal:2',
        'tanggal_bayar' => 'datetime',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function pasien(): BelongsTo
    {
        return $this->belongsTo(Pasien::class);
    }

    public function poli(): BelongsTo
    {
        return $this->belongsTo(Poli::class);
    }

    public function ruangan(): BelongsTo
    {
        return $this->belongsTo(Ruangan::class);
    }

    public function dokter(): BelongsTo
    {
        return $this->belongsTo(Nakes::class, 'dokter_id');
    }

    public function dokterPengganti(): BelongsTo
    {
        return $this->belongsTo(Nakes::class, 'dokter_pengganti_id');
    }

    public function perawat(): BelongsTo
    {
        return $this->belongsTo(Nakes::class, 'perawat_id');
    }

    public function asuransi(): BelongsTo
    {
        return $this->belongsTo(Asuransi::class);
    }

    public function ttv(): HasOne
    {
        return $this->hasOne(Ttv::class);
    }

    public function nursingAssessment(): HasOne
    {
        return $this->hasOne(NursingAssessment::class);
    }

    public function pemeriksaanDokter(): HasOne
    {
        return $this->hasOne(PemeriksaanDokter::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function kasir(): BelongsTo
    {
        return $this->belongsTo(User::class, 'kasir_id');
    }

    public function scopeForBranch($query, int $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeOfTipe($query, ?string $tipe)
    {
        if (! $tipe) return $query;
        return $query->where('tipe_kunjungan', $tipe);
    }

    public function scopeOfStatus($query, ?string $status)
    {
        if (! $status) return $query;
        return $query->where('status', $status);
    }
}