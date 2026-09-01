<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('poli', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('unit_lokasi_id')->nullable()->constrained('unit_lokasi')->nullOnDelete();
            $table->foreignId('depo_obat_id')->nullable()->constrained('depo_obat')->nullOnDelete();
            $table->string('kode', 50);
            $table->string('nama');
            $table->string('jenis_poli')->nullable();
            $table->boolean('antrian_ftkp')->default(false);
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->timestamps();

            // Kode poli unik per-branch
            $table->unique(['branch_id', 'kode']);
            $table->index('branch_id');
            $table->index('unit_lokasi_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('poli');
    }
};
