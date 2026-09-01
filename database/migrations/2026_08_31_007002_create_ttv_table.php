<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ttv', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kunjungan_id')->constrained('kunjungan')->cascadeOnDelete();

            // Keluhan
            $table->string('keluhan_utama', 500)->nullable();

            // Tanda Tanda Vital
            $table->decimal('suhu', 5, 2)->nullable();
            $table->decimal('saturasi_oksigen', 5, 2)->nullable();
            $table->string('kesadaran', 50)->nullable();

            // Antropometri
            $table->decimal('tinggi_badan', 5, 2)->nullable();
            $table->decimal('berat_badan', 6, 2)->nullable();
            $table->decimal('lingkar_perut', 5, 2)->nullable();
            $table->decimal('imt', 5, 2)->nullable();

            // Tekanan Darah & Frekuensi
            $table->unsignedSmallInteger('sistole')->nullable();
            $table->unsignedSmallInteger('diastole')->nullable();
            $table->unsignedSmallInteger('respiratory_rate')->nullable();
            $table->unsignedSmallInteger('heart_rate')->nullable();

            // Catatan
            $table->text('catatan_ttv')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('kunjungan_id');
        });

        // Hapus kolom JSON lama dari kunjungan (jika masih ada) agi tidak duplicate data
        if (Schema::hasColumn('kunjungan', 'data_ttv')) {
            Schema::table('kunjungan', function (Blueprint $table) {
                $table->dropColumn('data_ttv');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ttv');

        if (! Schema::hasColumn('kunjungan', 'data_ttv')) {
            Schema::table('kunjungan', function (Blueprint $table) {
                $table->json('data_ttv')->nullable()->after('keterangan_skrining');
            });
        }
    }
};
