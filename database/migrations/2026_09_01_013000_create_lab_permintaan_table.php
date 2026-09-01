<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lab_permintaan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('kunjungan_id')->constrained('kunjungan')->cascadeOnDelete();
            $table->foreignId('pasien_id')->nullable()->constrained('pasien')->nullOnDelete();
            $table->string('jenis_pemeriksaan', 255);
            $table->enum('status', ['menunggu', 'selesai', 'dibatalkan'])->default('menunggu');
            $table->text('hasil')->nullable();
            $table->text('catatan')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['branch_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lab_permintaan');
    }
};
