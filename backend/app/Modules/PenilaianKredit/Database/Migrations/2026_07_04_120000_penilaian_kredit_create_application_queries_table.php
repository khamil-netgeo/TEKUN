<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Module 2 — Penilaian Risiko & Skor Kredit
 * Migration: application_queries (Kuari/Clarification table)
 *
 * Stores kuari (clarification) requests with flagged fields,
 * AI suggestions, deadlines, and auto-escalation tracking.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Add missing columns to credit_assessments if they don't exist
        if (Schema::hasTable('credit_assessments')) {
            Schema::table('credit_assessments', function (Blueprint $table) {
                if (!Schema::hasColumn('credit_assessments', 'score_factors')) {
                    $table->text('score_factors')->nullable()->comment('JSON array of scoring factors');
                }
                if (!Schema::hasColumn('credit_assessments', 'amount_approved')) {
                    $table->decimal('amount_approved', 15, 2)->nullable();
                }
                if (!Schema::hasColumn('credit_assessments', 'tenure_approved')) {
                    $table->integer('tenure_approved')->nullable()->comment('Approved tenure in months');
                }
                if (!Schema::hasColumn('credit_assessments', 'profit_rate')) {
                    $table->decimal('profit_rate', 5, 2)->nullable()->comment('Annual profit rate %');
                }
                if (!Schema::hasColumn('credit_assessments', 'decision_reason')) {
                    $table->text('decision_reason')->nullable();
                }
                if (!Schema::hasColumn('credit_assessments', 'decided_at')) {
                    $table->timestamp('decided_at')->nullable();
                }
            });
        }

        // Create application_queries table for kuari/clarification
        if (!Schema::hasTable('application_queries')) {
            Schema::create('application_queries', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('application_id');
                $table->unsignedBigInteger('queried_by')->nullable();
                $table->text('flagged_fields')->nullable()->comment('JSON array of flagged field names');
                $table->text('notes')->nullable()->comment('Officer notes for the query');
                $table->text('ai_suggestions')->nullable()->comment('JSON array of AI-generated suggestions');
                $table->date('deadline')->nullable()->comment('Deadline for applicant to respond');
                $table->string('status', 50)->default('pending')->comment('pending | responded | escalated | resolved');
                $table->timestamp('responded_at')->nullable();
                $table->timestamp('escalated_at')->nullable();
                $table->text('response_notes')->nullable()->comment('Applicant or officer response notes');
                $table->timestamps();

                $table->index('application_id');
                $table->index('status');
                $table->index('deadline');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('application_queries');
    }
};
