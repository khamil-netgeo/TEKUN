<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Module 7 — CRM & Pemantauan Usahawan
 * Migration: field_visits table
 */
return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('field_visits')) { Schema::create('field_visits', function (Blueprint $table) {
            $table->id();
            $table->string('ref_no', 20)->unique(); // LW-001
            $table->foreignId('entrepreneur_id')->constrained('entrepreneurs');
            $table->foreignId('officer_id')->constrained('users');
            $table->foreignId('branch_id')->constrained('branches');

            $table->date('scheduled_date');
            $table->time('scheduled_time')->nullable();
            $table->string('purpose');   // Pemantauan Perniagaan, Tindakan Susulan NPL, Penilaian Semula, Lawatan Pertama
            $table->string('status')->default('Dijadualkan'); // Dijadualkan, Dalam Perjalanan, Selesai, Dibatalkan, Tidak Hadir

            // Visit checklist (JSON array of completed items)
            $table->json('checklist_items')->nullable();

            // Post-visit data
            $table->date('actual_date')->nullable();
            $table->time('actual_time')->nullable();
            $table->text('visit_notes')->nullable();

            // AI-generated report
            $table->text('ai_report')->nullable();
            $table->string('ai_report_model')->nullable();
            $table->timestamp('ai_report_generated_at')->nullable();

            // KPI captured during visit
            $table->decimal('reported_revenue', 12, 2)->nullable();
            $table->decimal('reported_expenses', 12, 2)->nullable();
            $table->integer('reported_employees')->nullable();
            $table->string('business_condition')->nullable(); // Baik, Sederhana, Lemah, Kritikal

            // GPS / location
            $table->string('gps_lat', 20)->nullable();
            $table->string('gps_lng', 20)->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['entrepreneur_id', 'status']);
            $table->index(['officer_id', 'scheduled_date']);
            $table->index('branch_id');
        }); }
    }

    public function down(): void
    {
        Schema::dropIfExists('field_visits');
    }
};
