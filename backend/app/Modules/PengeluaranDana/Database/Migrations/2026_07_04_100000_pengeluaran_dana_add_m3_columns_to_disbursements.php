<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Module 3 — Pengeluaran Dana
 * Adds M3-specific columns to the disbursements table:
 * - AI anomaly detection fields
 * - Authority matrix fields
 * - Batch disbursement / 2FA fields
 * - E-sign tracking fields
 * - SLA / aging escalation fields
 * - Status notification fields
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('disbursements', function (Blueprint $table) {
            // AI Anomaly Detection
            if (!Schema::hasColumn('disbursements', 'ai_anomaly_flag')) {
                $table->boolean('ai_anomaly_flag')->default(false)->after('is_escalated');
            }
            if (!Schema::hasColumn('disbursements', 'ai_anomaly_reason')) {
                $table->text('ai_anomaly_reason')->nullable()->after('ai_anomaly_flag');
            }
            if (!Schema::hasColumn('disbursements', 'ai_anomaly_score')) {
                $table->decimal('ai_anomaly_score', 5, 2)->nullable()->after('ai_anomaly_reason');
            }

            // Authority Matrix
            if (!Schema::hasColumn('disbursements', 'authority_level_required')) {
                $table->string('authority_level_required')->nullable()->after('ai_anomaly_score');
                // Values: branch_officer | branch_manager | credit_committee | board
            }
            if (!Schema::hasColumn('disbursements', 'authority_label')) {
                $table->string('authority_label')->nullable()->after('authority_level_required');
                // Human-readable: Pegawai Cawangan | Pengurus Cawangan | Jawatankuasa Kredit | Lembaga Pengarah
            }

            // Batch Disbursement
            if (!Schema::hasColumn('disbursements', 'payment_file_url')) {
                $table->string('payment_file_url')->nullable()->after('authority_label');
            }
            if (!Schema::hasColumn('disbursements', 'payment_file_format')) {
                $table->string('payment_file_format')->nullable()->after('payment_file_url');
                // fpx | rentas | iso20022
            }
            if (!Schema::hasColumn('disbursements', 'payment_file_generated_at')) {
                $table->timestamp('payment_file_generated_at')->nullable()->after('payment_file_format');
            }

            // 2FA Confirmation
            if (!Schema::hasColumn('disbursements', 'twofa_required')) {
                $table->boolean('twofa_required')->default(true)->after('payment_file_generated_at');
            }
            if (!Schema::hasColumn('disbursements', 'twofa_confirmed')) {
                $table->boolean('twofa_confirmed')->default(false)->after('twofa_required');
            }
            if (!Schema::hasColumn('disbursements', 'twofa_confirmed_at')) {
                $table->timestamp('twofa_confirmed_at')->nullable()->after('twofa_confirmed');
            }
            if (!Schema::hasColumn('disbursements', 'twofa_confirmed_by')) {
                $table->foreignId('twofa_confirmed_by')->nullable()->constrained('users')->after('twofa_confirmed_at');
            }

            // E-Sign Tracking
            if (!Schema::hasColumn('disbursements', 'esign_sent_at')) {
                $table->timestamp('esign_sent_at')->nullable()->after('twofa_confirmed_by');
            }
            if (!Schema::hasColumn('disbursements', 'esign_deadline')) {
                $table->timestamp('esign_deadline')->nullable()->after('esign_sent_at');
            }
            if (!Schema::hasColumn('disbursements', 'esign_reminder_sent')) {
                $table->boolean('esign_reminder_sent')->default(false)->after('esign_deadline');
            }
            if (!Schema::hasColumn('disbursements', 'esign_ai_anomaly')) {
                $table->boolean('esign_ai_anomaly')->default(false)->after('esign_reminder_sent');
            }
            if (!Schema::hasColumn('disbursements', 'esign_ai_anomaly_reason')) {
                $table->text('esign_ai_anomaly_reason')->nullable()->after('esign_ai_anomaly');
            }

            // SLA / Aging Escalation
            if (!Schema::hasColumn('disbursements', 'sla_breach')) {
                $table->boolean('sla_breach')->default(false)->after('esign_ai_anomaly_reason');
            }
            if (!Schema::hasColumn('disbursements', 'sla_breach_at')) {
                $table->timestamp('sla_breach_at')->nullable()->after('sla_breach');
            }
            if (!Schema::hasColumn('disbursements', 'escalated_to')) {
                $table->foreignId('escalated_to')->nullable()->constrained('users')->after('sla_breach_at');
            }
            if (!Schema::hasColumn('disbursements', 'escalated_at')) {
                $table->timestamp('escalated_at')->nullable()->after('escalated_to');
            }
            if (!Schema::hasColumn('disbursements', 'escalation_reason')) {
                $table->text('escalation_reason')->nullable()->after('escalated_at');
            }

            // Status Notification to Usahawan
            if (!Schema::hasColumn('disbursements', 'notify_sent')) {
                $table->boolean('notify_sent')->default(false)->after('escalation_reason');
            }
            if (!Schema::hasColumn('disbursements', 'notify_sent_at')) {
                $table->timestamp('notify_sent_at')->nullable()->after('notify_sent');
            }
            if (!Schema::hasColumn('disbursements', 'notify_channel')) {
                $table->string('notify_channel')->nullable()->after('notify_sent_at');
                // sms | email | both
            }

            // Bank Payment Confirmation
            if (!Schema::hasColumn('disbursements', 'bank_confirmation_ref')) {
                $table->string('bank_confirmation_ref')->nullable()->after('notify_channel');
            }
            if (!Schema::hasColumn('disbursements', 'bank_confirmed_at')) {
                $table->timestamp('bank_confirmed_at')->nullable()->after('bank_confirmation_ref');
            }
        });
    }

    public function down(): void
    {
        Schema::table('disbursements', function (Blueprint $table) {
            $columns = [
                'ai_anomaly_flag', 'ai_anomaly_reason', 'ai_anomaly_score',
                'authority_level_required', 'authority_label',
                'payment_file_url', 'payment_file_format', 'payment_file_generated_at',
                'twofa_required', 'twofa_confirmed', 'twofa_confirmed_at', 'twofa_confirmed_by',
                'esign_sent_at', 'esign_deadline', 'esign_reminder_sent',
                'esign_ai_anomaly', 'esign_ai_anomaly_reason',
                'sla_breach', 'sla_breach_at', 'escalated_to', 'escalated_at', 'escalation_reason',
                'notify_sent', 'notify_sent_at', 'notify_channel',
                'bank_confirmation_ref', 'bank_confirmed_at',
            ];
            foreach ($columns as $col) {
                if (Schema::hasColumn('disbursements', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
