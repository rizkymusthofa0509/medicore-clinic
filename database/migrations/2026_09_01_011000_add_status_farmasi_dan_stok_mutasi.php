<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Status verifikasi farmasi pada pemeriksaan dokter
        Schema::table('pemeriksaan_dokter', function (Blueprint $table) {
            $table->enum('status_farmasi', ['menunggu', 'dispensed', 'dibatalkan'])
                ->default('menunggu')
                ->after('status')
                ->comment('Alur farmasi: menunggu verifikasi, obat didispensasi, atau dibatalkan');
            $table->string('catatan_farmasi', 500)->nullable()->after('status_farmasi');
        });

        // Riwayat mutasi stok (masuk/keluar/dispensing/opname/penyesuaian)
        Schema::create('stok_mutasi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('obat_alkes_id')->constrained('obat_alkes')->cascadeOnDelete();
            $table->enum('tipe', ['masuk', 'keluar', 'dispensing', 'opname', 'penyesuaian'])
                ->default('masuk')
                ->comment('Jenis mutasi stok');
            $table->integer('qty')->comment('Jumlah mutasi (positif)');
            $table->integer('stok_sebelum')->default(0);
            $table->integer('stok_sesudah')->default(0);
            $table->unsignedBigInteger('harga_satuan')->default(0)->nullable();
            $table->string('ref_type', 50)->nullable()->comment('Sumber mutasi: pemeriksaan_dokter, dll');
            $table->unsignedBigInteger('ref_id')->nullable();
            $table->string('keterangan', 500)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['branch_id', 'obat_alkes_id']);
            $table->index('tipe');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stok_mutasi');
        Schema::table('pemeriksaan_dokter', function (Blueprint $table) {
            $table->dropColumn(['status_farmasi', 'catatan_farmasi']);
        });
    }
};
