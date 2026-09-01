<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('depo_obat', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->string('nama_depo');
            $table->string('lokasi')->nullable();
            $table->string('keterangan')->nullable();
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->timestamps();

            // Nama depo unik per-branch (tidak boleh duplikat dalam branch yang sama)
            $table->unique(['branch_id', 'nama_depo']);

            $table->index('branch_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('depo_obat');
    }
};
