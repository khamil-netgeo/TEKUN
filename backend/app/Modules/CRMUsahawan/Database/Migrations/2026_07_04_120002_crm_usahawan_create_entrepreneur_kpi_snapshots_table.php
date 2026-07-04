<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Module 7 — CRM & Pemantauan Usahawan
 * Migration: entrepreneur_kpi_snapshots — monthly KPI time series
 */
return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('entrepreneur_kpi_snapshots')) { Schema::create('entrepreneur_kpi_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entrepreneur_id')->constrained('entrepreneurs');
            $table->string('period', 7);  // YYYY-MM e.g. 2026-06
            $table->decimal('revenue', 12, 2)->default(0);
            $table->decimal('expenses', 12, 2)->default(0);
            $table->decimal('profit', 12, 2)->default(0);
            $table->integer('employee_count')->default(1);
            $table->decimal('sales_volume', 12, 2)->default(0);
            $table->string('source')->default('manual'); // manual, visit, system
            $table->timestamps();

            $table->unique(['entrepreneur_id', 'period']);
            $table->index('entrepreneur_id');
        }); }
    }

    public function down(): void
    {
        Schema::dropIfExists('entrepreneur_kpi_snapshots');
    }
};
