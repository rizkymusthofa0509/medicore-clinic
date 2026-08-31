<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'address',
        'phone',
        'operational_hours',
        'status',
    ];

    protected $casts = [
        'status' => 'string',
    ];

    /**
     * Get the users for this branch
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Check if branch is active
     */
    public function isActive(): bool
    {
        return $this->status === 'aktif';
    }

    /**
     * Scope for active branches
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'aktif');
    }
}
