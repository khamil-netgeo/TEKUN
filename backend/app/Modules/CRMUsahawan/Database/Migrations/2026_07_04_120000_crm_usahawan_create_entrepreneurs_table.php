<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Module 7 — CRM & Pemantauan Usahawan
 * Migration: entrepreneurs table
 */
return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('entrepreneurs')) { Schema::create('entrepreneurs', function (Blueprint $table) {
            $table->id();
            $table->string('ref_no', 20)->unique(); // USH-001
            $table->string('name');
            $table->string('ic_no', 14)->unique();
            $table->string('phone', 20);
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->string('district')->nullable();
            $table->string('state')->nullable();
            $table->string('race')->nullable();
            $table->string('gender')->nullable();
            $table->date('dob')->nullable();

            // Business info
            $table->string('business_name')->nullable();
            $table->string('business_reg_no', 30)->nullable();
            $table->string('sector')->nullable();       // Makanan & Minuman, Fesyen, Teknologi, etc.
            $table->string('sub_sector')->nullable();
            $table->string('business_type')->nullable(); // Sole Proprietor, Partnership, etc.
            $table->date('business_start_date')->nullable();
            $table->string('business_address')->nullable();
            $table->string('business_state')->nullable();

            // Financing summary (denormalised for quick CRM view)
            $table->string('skim')->nullable();          // TEKUN Micro, Usahawan, Wanita, Belia
            $table->decimal('total_financing', 12, 2)->default(0);
            $table->decimal('outstanding_balance', 12, 2)->default(0);
            $table->string('financing_status')->default('Lancar'); // Lancar, Perhatian Khusus, Tidak Lancar
            $table->foreignId('branch_id')->nullable()->constrained('branches');
            $table->foreignId('assigned_officer_id')->nullable()->constrained('users');

            // KPI fields
            $table->decimal('monthly_revenue', 12, 2)->nullable();
            $table->decimal('monthly_expenses', 12, 2)->nullable();
            $table->integer('employee_count')->default(1);
            $table->decimal('monthly_sales', 12, 2)->nullable();
            $table->string('kpi_updated_at')->nullable();

            // AI health score (cached, refreshed by AI service)
            $table->integer('health_score')->default(50);           // 0–100
            $table->string('distress_level')->default('Rendah');    // Rendah, Sederhana, Tinggi, Kritikal
            $table->decimal('default_probability', 5, 4)->default(0.00);
            $table->json('ai_factors')->nullable();                 // array of contributing factors
            $table->timestamp('ai_score_updated_at')->nullable();

            // pgvector embedding for semantic search (RAG)
            $table->vector('embedding', 1536)->nullable();

            $table->string('status')->default('aktif'); // aktif, tidak_aktif, blacklist
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['financing_status', 'branch_id']);
            $table->index('state');
            $table->index('health_score');
        }); }
    }

    public function down(): void
    {
        Schema::dropIfExists('entrepreneurs');
    }
};