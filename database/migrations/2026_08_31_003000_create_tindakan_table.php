<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tindakan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('poli_id')->nullable()->constrained('poli')->nullOnDelete();
            $table->string('kelompok_tindakan')->nullable();
            $table->string('kode_icd9', 50);
            $table->string('nama_tindakan');
            $table->unsignedBigInteger('jumlah_biaya')->default(0);

            // Jasa Dokter: nominal, persen, dan rupiah hasil
            $table->unsignedBigInteger('jasa_dokter')->default(0);
            $table->unsignedTinyInteger('persentase_dokter')->default(0);
            $table->unsignedBigInteger('rupiah_dokter')->default(0);

            // Jasa Asisten: nominal, persen, dan rupiah hasil
            $table->unsignedBigInteger('jasa_asisten')->default(0);
            $table->unsignedTinyInteger('persentase_asisten')->default(0);
            $table->unsignedBigInteger('rupiah_asisten')->default(0);

            // Jasa Klinik: nominal, persen, dan rupiah hasil
            $table->unsignedBigInteger('jasa_klinik')->default(0);
            $table->unsignedTinyInteger('persentase_klinik')->default(0);
            $table->unsignedBigInteger('rupiah_klinik')->default(0);

            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->timestamps();

            // Kode ICD-9 unik per-branch
            $table->unique(['branch_id', 'kode_icd9']);
            $table->index('branch_id');
            $table->index('poli_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tindakan');
    }
};
