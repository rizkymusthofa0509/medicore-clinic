<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('aturan_pakai', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->string('aturan', 255);
            $table->boolean('status_aktif')->default(true);
            $table->timestamps();

            $table->unique(['branch_id', 'aturan']);
            $table->index('branch_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('aturan_pakai');
    }
};
