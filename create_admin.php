<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\Branch;

echo "Creating admin user...\n";

$user = User::firstOrCreate(['email' => 'admin@medicore.com'], [
    'name' => 'Admin Medicore',
    'password' => bcrypt('password'),
    'role' => 'admin',
    'is_active' => true,
    'branch_id' => 1
]);

echo "Admin created/updated: " . $user->email . "\n";

$branches = Branch::all();
echo "Available branches:\n";
foreach ($branches as $b) {
    echo "  - ID: {$b->id} | {$b->name} ({$b->code})\n";
}

$syncData = [];
$branches->each(function ($b, $i) use (&$syncData) {
    $syncData[$b->id] = ['is_default' => $i === 0];
});

$user->branches()->sync($syncData);
echo "Admin branches synced: " . $user->branches()->count() . "\n";
