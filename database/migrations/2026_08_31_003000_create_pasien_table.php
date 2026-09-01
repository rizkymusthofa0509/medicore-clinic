<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pasien', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            // Unit Tujuan: FK ke unit_lokasi (nullable agar opsional)
            $table->foreignId('unit_lokasi_id')->nullable()->constrained('unit_lokasi')->nullOnDelete();

            // Identitas utama
            $table->string('no_rm', 30); // auto-generated, unique per branch
            $table->string('no_rm_lama', 50)->nullable();

            // Identitas negara
            $table->enum('jenis_identitas', ['KTP', 'SIM', 'Paspot', 'Kartu Keluarga', 'Tanpa Identitas'])->default('KTP');
            $table->string('nik', 20)->nullable();
            $table->string('satusehat_id', 50)->nullable();

            // Biodata
            $table->string('gelar', 30)->nullable();
            $table->string('nama', 200);
            $table->string('tempat_lahir', 100);
            $table->date('tanggal_lahir');
            $table->enum('jenis_kelamin', ['L', 'P']); // disingkat agar ringkas
            $table->enum('golongan_darah', ['A', 'B', 'AB', 'O'])->nullable();
            $table->string('agama', 30)->nullable();
            $table->string('pendidikan', 30)->nullable();
            $table->string('pekerjaan', 100)->nullable();

            // Alamat tinggal
            $table->text('alamat')->nullable();
            $table->string('rt', 5)->nullable();
            $table->string('rw', 5)->nullable();
            $table->string('nama_desa', 100)->nullable();

            // Alamat KTP (opsional, hanya jika berbeda)
            $table->boolean('alamat_ktp_berbeda')->default(false);
            $table->text('alamat_ktp')->nullable();
            $table->string('rt_ktp', 5)->nullable();
            $table->string('rw_ktp', 5)->nullable();
            $table->string('desa_ktp', 100)->nullable();

            // Kontak
            $table->string('no_hp', 20)->nullable();

            $table->timestamps();

            // No RM unik per branch
            $table->unique(['branch_id', 'no_rm']);

            // Index untuk pencarian
            $table->index(['branch_id', 'nama']);
            $table->index('unit_lokasi_id');
            $table->index('nik');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pasien');
    }
};
