<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ruangan', function (Blueprint $table) {
            $table->id();
            // Ruangan tetap menyimpan branch_id langsung agar mudah filter per-branch
            // tanpa harus join ke poli (konsistensi dengan tabel master lain).
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('poli_id')->constrained('poli')->cascadeOnDelete();
            $table->string('kode', 50);
            $table->string('nama_ruangan');
            $table->string('kelas')->nullable();
            $table->integer('kapasitas')->default(1);
            $table->enum('status', ['tersedia', 'terisi', 'maintenance'])->default('tersedia');
            $table->string('keterangan')->nullable();
            $table->timestamps();

            // Kode ruangan unik dalam satu poli
            $table->unique(['poli_id', 'kode']);
            $table->index('branch_id');
            $table->index('poli_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ruangan');
    }
};
