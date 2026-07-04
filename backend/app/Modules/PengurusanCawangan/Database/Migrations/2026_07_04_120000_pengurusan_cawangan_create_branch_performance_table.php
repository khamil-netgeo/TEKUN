<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('branch_performance')) { Schema::create('branch_performance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->string('period', 7);           // e.g. 2026-07
            $table->decimal('target_amount', 15, 2)->default(0);
            $table->decimal('actual_amount', 15, 2)->default(0);
            $table->decimal('collection_rate', 5, 2)->default(0);
            $table->decimal('npl_ratio', 5, 2)->default(0);
            $table->integer('new_applications')->default(0);
            $table->integer('approved_applications')->default(0);
            $table->integer('rejected_applications')->default(0);
            $table->integer('performance_rank')->nullable();
            $table->timestamps();

            $table->unique(['branch_id', 'period']);
            $table->index(['period', 'performance_rank']);
        }); }
    }

    public function down(): void
    {
        Schema::dropIfExists('branch_performance');
    }
};
