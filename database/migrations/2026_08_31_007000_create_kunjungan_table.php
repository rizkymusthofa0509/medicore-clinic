<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kunjungan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('pasien_id')->constrained('pasien')->cascadeOnDelete();

            // Identitas kunjungan
            $table->string('no_pendaftaran', 30);
            $table->enum('tipe_kunjungan', ['rawat_jalan', 'rawat_inap'])->default('rawat_jalan');
            $table->enum('jenis_kunjungan', ['baru', 'lama', 'kontrol', 'rujukan', 'langsung'])->default('lama');
            $table->dateTime('tgl_jam_kunjungan');

            // Master relasi
            $table->foreignId('poli_id')->nullable()->constrained('poli')->nullOnDelete();
            $table->foreignId('ruangan_id')->nullable()->constrained('ruangan')->nullOnDelete();
            $table->foreignId('dokter_id')->nullable()->constrained('nakes')->nullOnDelete();
            $table->foreignId('dokter_pengganti_id')->nullable()->constrained('nakes')->nullOnDelete();
            $table->foreignId('perawat_id')->nullable()->constrained('nakes')->nullOnDelete();
            $table->foreignId('asuransi_id')->nullable()->constrained('asuransi')->nullOnDelete();

            // Penanggung jawab
            $table->string('penanggung_jawab', 200)->nullable();
            $table->string('hubungan_pj', 50)->nullable();

            // Perujuk & Pembayaran
            $table->string('nama_perujuk', 200)->nullable();
            $table->string('no_asuransi', 100)->nullable();
            $table->decimal('biaya_pendaftaran', 12, 2)->default(0);
            $table->enum('metode_pembayaran', ['tunai', 'asuransi', 'bpjs', 'transfer', 'qris'])->default('tunai');

            // Triase
            $table->enum('status_prioritas', ['normal', 'urgent', 'emergency'])->default('normal');
            $table->json('skrining_visual')->nullable();
            $table->text('keterangan_skrining')->nullable();

            // Status kunjungan
            $table->enum('status', ['terdaftar', 'menunggu', 'diperiksa', 'selesai', 'batal'])->default('terdaftar');

            // Audit
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['branch_id', 'no_pendaftaran']);
            $table->index(['branch_id', 'tgl_jam_kunjungan']);
            $table->index('pasien_id');
            $table->index('poli_id');
            $table->index('dokter_id');
            $table->index('status');
            $table->index('tipe_kunjungan');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kunjungan');
    }
};