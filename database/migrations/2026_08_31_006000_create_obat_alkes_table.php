<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('obat_alkes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->enum('kategori', ['obat', 'alkes', 'pbf']);

            // Field inti (semua kategori)
            $table->string('nama', 255);

            // Khusus obat & alkes
            $table->string('kode_kfa', 50)->nullable();
            $table->string('satuan_terbesar', 50)->nullable();
            $table->string('satuan_terkecil', 50)->nullable();
            $table->unsignedInteger('jumlah_per_satuan_terbesar')->nullable();
            $table->unsignedBigInteger('harga_jual')->default(0);
            $table->unsignedInteger('stok')->default(0);

            // PBF (Pemasok) — alamat singkat
            $table->string('alamat')->nullable();
            $table->string('no_telp', 32)->nullable();
            $table->string('email')->nullable();

            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->timestamps();

            // Kode KFA unik per-branch (nullable) — MySQL mengizinkan multiple NULL
            $table->unique(['branch_id', 'kode_kfa']);
            $table->index(['branch_id', 'kategori']);
            $table->index('branch_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('obat_alkes');
    }
};
