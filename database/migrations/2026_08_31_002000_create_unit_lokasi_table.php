<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('unit_lokasi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->string('kode', 50);
            $table->string('nama_unit');
            $table->enum('jenis', ['rawat_jalan', 'rawat_inap', 'penunjang', 'umum'])->default('rawat_jalan');
            $table->string('lokasi')->nullable();
            $table->string('keterangan')->nullable();
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->timestamps();

            // Kode unit lokasi unik per-branch
            $table->unique(['branch_id', 'kode']);
            $table->index('branch_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('unit_lokasi');
    }
};
