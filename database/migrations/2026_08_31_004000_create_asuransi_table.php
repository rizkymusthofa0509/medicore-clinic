<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asuransi', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->string('nama_perusahaan', 255);
            $table->boolean('harga_obat_khusus')->default(false);
            $table->boolean('status_aktif')->default(true);
            $table->timestamps();

            // Nama perusahaan unik per-branch
            $table->unique(['branch_id', 'nama_perusahaan']);
            $table->index('branch_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asuransi');
    }
};
