<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Module 6 — Laporan & Analitik
 * Migration: officer_skill_profiles
 * Stores AI skill profiles for officers to personalise AI decision-assist.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('officer_skill_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->text('skills_description');          // Free-text skill description
            $table->json('skill_tags')->nullable();       // Parsed skill tags array
            $table->string('specialisation')->nullable(); // e.g. "Pembiayaan Pertanian"
            $table->integer('years_experience')->default(0);
            $table->decimal('approval_rate', 5, 2)->default(0); // Historical approval rate
            $table->integer('total_decisions')->default(0);      // Total AI-assisted decisions
            $table->json('persona_config')->nullable();           // AI persona configuration JSON
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->unique('user_id'); // One profile per officer
        });

        Schema::create('officer_ai_decisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('officer_skill_profile_id')
                  ->constrained('officer_skill_profiles')
                  ->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('case_type');           // e.g. "permohonan_pembiayaan"
            $table->string('case_reference')->nullable();
            $table->text('context_summary');       // Brief case context
            $table->string('ai_recommendation');   // LULUS | TOLAK | KUARI
            $table->decimal('confidence_score', 5, 2)->default(0);
            $table->text('reasoning_bm');          // AI reasoning in BM
            $table->text('reasoning_en')->nullable();
            $table->json('factors')->nullable();   // Key factors JSON
            $table->string('officer_override')->nullable(); // If officer overrode AI
            $table->text('override_reason')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('officer_ai_decisions');
        Schema::dropIfExists('officer_skill_profiles');
    }
};
