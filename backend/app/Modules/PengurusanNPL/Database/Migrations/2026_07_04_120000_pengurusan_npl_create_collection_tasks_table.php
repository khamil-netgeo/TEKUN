<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Module 5 — Pengurusan NPL
 * Migration: collection_tasks table
 * Stores AI-prioritized collection tasks for officers.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('collection_tasks')) { Schema::create('collection_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->onDelete('cascade');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
            $table->string('status')->default('pending'); // pending | in_progress | completed | escalated
            $table->integer('priority_score')->default(50); // 0-100, AI-generated
            $table->string('ai_suggested_channel')->nullable(); // sms | email | whatsapp | call | visit
            $table->time('ai_best_contact_time')->nullable(); // e.g. 10:00:00
            $table->text('ai_recommendation')->nullable();
            $table->string('last_outcome')->nullable(); // no_answer | promised_payment | refused | paid | rescheduled
            $table->text('outcome_notes')->nullable();
            $table->timestamp('last_contacted_at')->nullable();
            $table->timestamp('follow_up_at')->nullable();
            $table->integer('attempt_count')->default(0);
            $table->timestamps();

            $table->index('status');
            $table->index('priority_score');
        }); }
    }

    public function down(): void
    {
        Schema::dropIfExists('collection_tasks');
    }
};