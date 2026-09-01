<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nakes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->string('nama', 255);
            $table->string('nik', 32);
            $table->string('email')->nullable();
            $table->enum('tipe', ['dokter', 'perawat', 'bidan', 'analis_lab']);
            $table->string('no_str', 100)->nullable();
            $table->string('no_sip', 100)->nullable();
            $table->date('str_expired_at')->nullable();
            $table->date('sip_expired_at')->nullable();
            $table->string('kode_bpjs', 50)->nullable();
            $table->string('ihs_satusehat', 100)->nullable();
            $table->string('spesialisasi', 100)->nullable();
            $table->string('no_telp', 32)->nullable();
            $table->enum('status', ['aktif', 'nonaktif'])->default('aktif');
            $table->timestamps();

            $table->unique(['branch_id', 'nik']);
            $table->index(['branch_id', 'tipe']);
            $table->index('branch_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nakes');
    }
};
