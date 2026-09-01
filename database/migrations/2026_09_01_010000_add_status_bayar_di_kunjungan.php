<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kunjungan', function (Blueprint $table) {
            $table->enum('status_bayar', ['belum_bayar', 'lunas', 'persetujuan'])
                ->default('belum_bayar')
                ->after('status')
                ->comment('Status pembayaran tagihan kunjungan');
            $table->unsignedBigInteger('jumlah_dibayarkan')->default(0)->after('status_bayar');
            $table->string('catatan_bayar', 500)->nullable()->after('jumlah_dibayarkan');
            $table->timestamp('tanggal_bayar')->nullable()->after('catatan_bayar');
            $table->foreignId('kasir_id')->nullable()->after('tanggal_bayar')->comment('User kasir yang memproses pembayaran');
        });
    }

    public function down(): void
    {
        Schema::table('kunjungan', function (Blueprint $table) {
            $table->dropColumn(['status_bayar', 'jumlah_dibayarkan', 'tanggal_bayar', 'kasir_id']);
        });
    }
};
