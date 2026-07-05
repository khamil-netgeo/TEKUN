<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Module 6 — Laporan & Analitik
 * Migration: Alter officer_skill_profiles to add missing columns,
 * create officer_ai_decisions and ai_dashboard_configs tables.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Add missing columns to officer_skill_profiles
        Schema::table('officer_skill_profiles', function (Blueprint $table) {
            if (!Schema::hasColumn('officer_skill_profiles', 'skills_description')) {
                $table->text('skills_description')->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('officer_skill_profiles', 'skill_tags')) {
                $table->json('skill_tags')->nullable()->after('skills_description');
            }
            if (!Schema::hasColumn('officer_skill_profiles', 'specialisation')) {
                $table->string('specialisation')->nullable()->after('skill_tags');
            }
            if (!Schema::hasColumn('officer_skill_profiles', 'years_experience')) {
                $table->integer('years_experience')->default(0)->after('specialisation');
            }
            if (!Schema::hasColumn('officer_skill_profiles', 'approval_rate')) {
                $table->decimal('approval_rate', 5, 2)->default(0)->after('years_experience');
            }
            if (!Schema::hasColumn('officer_skill_profiles', 'persona_config')) {
                $table->json('persona_config')->nullable()->after('approval_rate');
            }
            if (!Schema::hasColumn('officer_skill_profiles', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('persona_config');
            }
            if (!Schema::hasColumn('officer_skill_profiles', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        // Create officer_ai_decisions table if not exists
        if (!Schema::hasTable('officer_ai_decisions')) {
            Schema::create('officer_ai_decisions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('officer_skill_profile_id')
                      ->nullable()
                      ->constrained('officer_skill_profiles')
                      ->onDelete('set null');
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->string('case_type');
                $table->string('case_reference')->nullable();
                $table->text('context_summary');
                $table->string('ai_recommendation');
                $table->decimal('confidence_score', 5, 2)->default(0);
                $table->text('reasoning_bm');
                $table->text('reasoning_en')->nullable();
                $table->json('factors')->nullable();
                $table->string('officer_override')->nullable();
                $table->text('override_reason')->nullable();
                $table->timestamps();
            });
        }

        // Create ai_dashboard_configs table if not exists
        if (!Schema::hasTable('ai_dashboard_configs')) {
            Schema::create('ai_dashboard_configs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->string('name');
                $table->text('prompt');
                $table->json('widget_config');
                $table->string('status')->default('active');
                $table->integer('use_count')->default(0);
                $table->timestamp('last_used_at')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_dashboard_configs');
        Schema::dropIfExists('officer_ai_decisions');
    }
};
