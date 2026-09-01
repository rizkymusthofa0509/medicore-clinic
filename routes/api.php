<?php

use App\Http\Controllers\Api\AsuransiController;
use App\Http\Controllers\Api\AturanPakaiController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DepoObatController;
use App\Http\Controllers\Api\FarmasiController;
use App\Http\Controllers\Api\KasirController;
use App\Http\Controllers\Api\KunjunganController;
use App\Http\Controllers\Api\NakesController;
use App\Http\Controllers\Api\ObatAlkesController;
use App\Http\Controllers\Api\PasienController;
use App\Http\Controllers\Api\PendapatanController;
use App\Http\Controllers\Api\PemeriksaanDokterController;
use App\Http\Controllers\Api\PoliController;
use App\Http\Controllers\Api\RuanganController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\TindakanController;
use App\Http\Controllers\Api\UnitLokasiController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::get('/ping', function () {
    return response()->json([
        'success' => true,
        'message' => 'pong',
        'timestamp' => now()->toIso8601String(),
    ]);
});

Route::post('/login', [AuthController::class, 'login']);

// Protected routes (require Sanctum auth)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me', [AuthController::class, 'updateProfile']);
    Route::post('/me/change-password', [AuthController::class, 'changePassword']);

    // Settings
    Route::prefix('settings')->group(function () {
        // Branch
        Route::get('/branches', [SettingController::class, 'getBranches']);
        Route::post('/branches', [SettingController::class, 'storeBranch']);
        Route::put('/branches/{id}', [SettingController::class, 'updateBranch']);
        Route::delete('/branches/{id}', [SettingController::class, 'deleteBranch']);

        // User
        Route::get('/users', [SettingController::class, 'getUsers']);
        Route::post('/users', [SettingController::class, 'storeUser']);
        Route::put('/users/{id}', [SettingController::class, 'updateUser']);
        Route::delete('/users/{id}', [SettingController::class, 'deleteUser']);

        // User Branches (multi-branch)
        Route::get('/users/{userId}/branches', [SettingController::class, 'getUserBranches']);
        Route::post('/users/{userId}/branches', [SettingController::class, 'syncUserBranches']);
    });

    // Depo Obat (data terpisah per branch_id)
    Route::prefix('depo-obat')->group(function () {
        Route::get('/', [DepoObatController::class, 'index']);
        Route::post('/', [DepoObatController::class, 'store']);
        Route::get('/{id}', [DepoObatController::class, 'show']);
        Route::put('/{id}', [DepoObatController::class, 'update']);
        Route::delete('/{id}', [DepoObatController::class, 'destroy']);
    });

    // Unit Lokasi, Poli, Ruangan (data terpisah per branch_id)
    Route::prefix('unit-lokasi')->group(function () {
        Route::get('/', [UnitLokasiController::class, 'index']);
        Route::post('/', [UnitLokasiController::class, 'store']);
        Route::get('/{id}', [UnitLokasiController::class, 'show']);
        Route::put('/{id}', [UnitLokasiController::class, 'update']);
        Route::delete('/{id}', [UnitLokasiController::class, 'destroy']);
    });

    Route::prefix('poli')->group(function () {
        Route::get('/', [PoliController::class, 'index']);
        Route::post('/', [PoliController::class, 'store']);
        Route::get('/{id}', [PoliController::class, 'show']);
        Route::put('/{id}', [PoliController::class, 'update']);
        Route::delete('/{id}', [PoliController::class, 'destroy']);
    });

    Route::prefix('ruangan')->group(function () {
        Route::get('/', [RuanganController::class, 'index']);
        Route::post('/', [RuanganController::class, 'store']);
        Route::get('/{id}', [RuanganController::class, 'show']);
        Route::put('/{id}', [RuanganController::class, 'update']);
        Route::delete('/{id}', [RuanganController::class, 'destroy']);
    });

    // Pasien (data terpisah per branch_id)
    Route::prefix('pasien')->group(function () {
        Route::get('/', [PasienController::class, 'index']);
        Route::get('/next-rm', [PasienController::class, 'nextRm']);
        Route::post('/', [PasienController::class, 'store']);
        Route::get('/{id}', [PasienController::class, 'show']);
        Route::put('/{id}', [PasienController::class, 'update']);
        Route::delete('/{id}', [PasienController::class, 'destroy']);
    });

    // Tindakan Medis (data terpisah per branch_id)
    Route::prefix('tindakan')->group(function () {
        Route::get('/', [TindakanController::class, 'index']);
        Route::post('/', [TindakanController::class, 'store']);
        Route::get('/{id}', [TindakanController::class, 'show']);
        Route::put('/{id}', [TindakanController::class, 'update']);
        Route::delete('/{id}', [TindakanController::class, 'destroy']);
    });

    // Nakes (Dokter, Perawat, Bidan, Analis Lab) per branch_id
    Route::prefix('nakes')->group(function () {
        Route::get('/', [NakesController::class, 'index']);
        Route::post('/', [NakesController::class, 'store']);
        Route::get('/{id}', [NakesController::class, 'show']);
        Route::put('/{id}', [NakesController::class, 'update']);
        Route::delete('/{id}', [NakesController::class, 'destroy']);
    });

    // Asuransi / Perusahaan Asuransi per branch_id
    Route::prefix('asuransi')->group(function () {
        Route::get('/', [AsuransiController::class, 'index']);
        Route::post('/', [AsuransiController::class, 'store']);
        Route::get('/{id}', [AsuransiController::class, 'show']);
        Route::put('/{id}', [AsuransiController::class, 'update']);
        Route::delete('/{id}', [AsuransiController::class, 'destroy']);
    });

    // Aturan Pakai (untuk dropdown resep) per branch_id
    Route::prefix('aturan-pakai')->group(function () {
        Route::get('/', [AturanPakaiController::class, 'index']);
        Route::post('/', [AturanPakaiController::class, 'store']);
        Route::get('/{id}', [AturanPakaiController::class, 'show']);
        Route::put('/{id}', [AturanPakaiController::class, 'update']);
        Route::delete('/{id}', [AturanPakaiController::class, 'destroy']);
    });

    // Obat, Alkes & PBF per branch_id
    Route::prefix('obat-alkes')->group(function () {
        Route::get('/', [ObatAlkesController::class, 'index']);
        Route::post('/', [ObatAlkesController::class, 'store']);
        Route::get('/{id}', [ObatAlkesController::class, 'show']);
        Route::put('/{id}', [ObatAlkesController::class, 'update']);
        Route::delete('/{id}', [ObatAlkesController::class, 'destroy']);
    });

    // Kunjungan (data terpisah per branch_id)
    Route::prefix('kunjungan')->group(function () {
        Route::get('/', [KunjunganController::class, 'index']);
        Route::get('/next-nomor', [KunjunganController::class, 'nextNomor']);
        Route::post('/', [KunjunganController::class, 'store']);
        Route::get('/{id}', [KunjunganController::class, 'show']);
        Route::put('/{id}', [KunjunganController::class, 'update']);
        Route::delete('/{id}', [KunjunganController::class, 'destroy']);
        Route::post('/{id}/ttv', [KunjunganController::class, 'storeTtv']);
        Route::get('/{id}/nursing-assessment', [KunjunganController::class, 'showNursingAssessment']);
        Route::post('/{id}/nursing-assessment', [KunjunganController::class, 'storeNursingAssessment']);
        Route::get('/{id}/pemeriksaan-dokter', [PemeriksaanDokterController::class, 'show']);
        Route::post('/{id}/pemeriksaan-dokter', [PemeriksaanDokterController::class, 'store']);
    });

    // Pemeriksaan Dokter (riwayat per branch / pasien)
    Route::prefix('pemeriksaan-dokter')->group(function () {
        Route::get('/', [PemeriksaanDokterController::class, 'index']);
    });

    // Laporan Pendapatan per branch
    Route::prefix('laporan')->group(function () {
        Route::get('/pendapatan', [PendapatanController::class, 'index']);
    });

    // Kasir & Pembayaran (data terpisah per branch_id)
    Route::prefix('kasir')->group(function () {
        Route::get('/tagihan', [KasirController::class, 'tagihan']);
        Route::get('/tagihan/{id}', [KasirController::class, 'detail']);
        Route::post('/tagihan/{id}/bayar', [KasirController::class, 'bayar']);
    });

    // Farmasi (data terpisah per branch_id)
    Route::prefix('farmasi')->group(function () {
        Route::get('/resep', [FarmasiController::class, 'resep']);
        Route::post('/resep/{id}/dispense', [FarmasiController::class, 'dispense']);
        Route::post('/resep/{id}/batalkan', [FarmasiController::class, 'batalkan']);
        Route::get('/stok', [FarmasiController::class, 'stok']);
    });
});
