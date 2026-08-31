<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // Get default branch (BR-001)
        $defaultBranch = Branch::where('code', 'BR-001')->first();

        // Create admin user with default branch
        User::create([
            'name' => 'Admin Medicore',
            'email' => 'admin@medicore.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'is_active' => true,
            'branch_id' => $defaultBranch?->id,
        ]);
    }
}
