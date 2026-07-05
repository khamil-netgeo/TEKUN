<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Module 6 — Laporan & Analitik
 * Migration: ai_dashboard_configs
 * Stores AI-generated dashboard widget configurations for reuse.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_dashboard_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('name');                    // Dashboard config name
            $table->text('prompt');                    // Original user prompt
            $table->json('widget_config');             // Generated widget JSON array
            $table->string('status')->default('active'); // active | archived
            $table->integer('use_count')->default(0);  // How many times reused
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_dashboard_configs');
    }
};
