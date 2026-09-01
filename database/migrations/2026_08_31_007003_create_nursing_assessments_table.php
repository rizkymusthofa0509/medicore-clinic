<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nursing_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kunjungan_id')->constrained('kunjungan')->cascadeOnDelete();

            // SOAPIE dokumentasi keperawatan
            $table->text('subjektif')->nullable();
            $table->text('objektif')->nullable();
            $table->text('asesmen')->nullable();
            $table->text('plan')->nullable();
            $table->text('implementasi')->nullable();
            $table->text('evaluasi')->nullable();

            // Meta
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('kunjungan_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nursing_assessments');
    }
};
