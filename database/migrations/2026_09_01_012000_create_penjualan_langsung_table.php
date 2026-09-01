<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('penjualan_langsung', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->string('no_transaksi', 40);
            $table->foreignId('obat_alkes_id')->nullable()->constrained('obat_alkes')->nullOnDelete();
            $table->string('nama_obat', 255);
            $table->integer('qty');
            $table->unsignedBigInteger('harga_satuan')->default(0);
            $table->unsignedBigInteger('total')->default(0);
            $table->enum('metode_pembayaran', ['tunai', 'qris', 'transfer'])->default('tunai');
            $table->string('keterangan', 500)->nullable();
            $table->foreignId('kasir_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['branch_id', 'created_at']);
            $table->unique(['branch_id', 'no_transaksi']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('penjualan_langsung');
    }
};
