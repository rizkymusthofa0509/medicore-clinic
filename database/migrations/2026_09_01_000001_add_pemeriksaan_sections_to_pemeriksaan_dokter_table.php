<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pemeriksaan_dokter', function (Blueprint $table) {
            $table->json('riwayat_penyakit')->nullable()->after('riwayat_obat');
            $table->json('diagnosa')->nullable()->after('riwayat_penyakit');
            $table->json('pemberian_obat')->nullable()->after('diagnosa');
            $table->json('pemberian_obat_racik')->nullable()->after('pemberian_obat');
            $table->json('pemberian_tindakan')->nullable()->after('pemberian_obat_racik');
        });
    }

    public function down(): void
    {
        Schema::table('pemeriksaan_dokter', function (Blueprint $table) {
            $table->dropColumn(['riwayat_penyakit', 'diagnosa', 'pemberian_obat', 'pemberian_obat_racik', 'pemberian_tindakan']);
        });
    }
};
