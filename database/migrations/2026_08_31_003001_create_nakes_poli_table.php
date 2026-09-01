<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nakes_poli', function (Blueprint $table) {
            $table->id();
            $table->foreignId('nakes_id')->constrained('nakes')->cascadeOnDelete();
            $table->foreignId('poli_id')->constrained('poli')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['nakes_id', 'poli_id']);
            $table->index('nakes_id');
            $table->index('poli_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nakes_poli');
    }
};
