<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pemeriksaan_dokter', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('kunjungan_id')->unique()->constrained('kunjungan')->cascadeOnDelete();
            $table->foreignId('pasien_id')->nullable()->constrained('pasien')->nullOnDelete();
            $table->foreignId('poli_id')->nullable()->constrained('poli')->nullOnDelete();
            $table->foreignId('dokter_id')->nullable()->constrained('nakes')->nullOnDelete();
            $table->string('status')->default('draft'); // draft | final

            // Setiap section disimpan sebagai JSON (detail berupa table list, bukan deskripsi bebas)
            $table->json('registrasi')->nullable();          // keluhan utama, jenis kunjungan, penanggung jawab
            $table->json('ttv')->nullable();                 // detail tanda-tanda vital
            $table->json('pemeriksaan_fisik')->nullable();   // [{ area, label, kondisi, keterangan }]
            $table->json('anatomi')->nullable();             // [{ area, label, x, y, keterangan }]
            $table->json('riwayat_alergi')->nullable();
            $table->json('riwayat_obat')->nullable();
            $table->json('catatan')->nullable();

            // Meta
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('branch_id');
            $table->index('pasien_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pemeriksaan_dokter');
    }
};
