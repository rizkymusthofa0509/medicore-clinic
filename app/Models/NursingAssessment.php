<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NursingAssessment extends Model
{
    use HasFactory;

    protected $table = 'nursing_assessments';

    protected $fillable = [
        'kunjungan_id',
        'subjektif',
        'objektif',
        'asesmen',
        'plan',
        'implementasi',
        'evaluasi',
        'created_by',
        'updated_by',
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
