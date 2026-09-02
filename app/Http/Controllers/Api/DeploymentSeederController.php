<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

class DeploymentSeederController extends Controller
{
    /**
     * Dipakai deployment pipeline ketika belum ada akun pada database.
     * Header X-Seed-Token wajib cocok dengan DEPLOYMENT_SEED_TOKEN.
     */
    public function run(Request $request)
    {
        $expectedToken = (string) config('app.deployment_seed_token');
        $providedToken = (string) $request->header('X-Seed-Token');

        if ($expectedToken === '' || ! hash_equals($expectedToken, $providedToken)) {
            return response()->json([
                'success' => false,
                'message' => 'Endpoint seed tidak diaktifkan atau token tidak valid.',
            ], 403);
        }

        DB::transaction(function () {
            Artisan::call('db:seed', [
                '--class' => DatabaseSeeder::class,
                '--force' => true,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Seed data awal selesai. Data dengan identitas yang sama dilewati.',
        ]);
    }
}
