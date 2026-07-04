<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Module 1 — Add missing columns to applications table
 * Adds: submitted_at, decided_at, is_auto_rejected, auto_reject_narrative,
 *       eligibility_checks, business_name, business_type, business_age_months,
 *       monthly_income, monthly_expense, loan_purpose
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            // Timestamps
            if (!Schema::hasColumn('applications', 'submitted_at')) {
                $table->timestamp('submitted_at')->nullable()->after('approved_at');
            }
            if (!Schema::hasColumn('applications', 'decided_at')) {
                $table->timestamp('decided_at')->nullable()->after('submitted_at');
            }

            // Auto-reject fields
            if (!Schema::hasColumn('applications', 'is_auto_rejected')) {
                $table->boolean('is_auto_rejected')->default(false)->after('auto_reject_reason');
            }
            if (!Schema::hasColumn('applications', 'auto_reject_narrative')) {
                $table->text('auto_reject_narrative')->nullable()->after('is_auto_rejected');
            }

            // Eligibility checks JSON
            if (!Schema::hasColumn('applications', 'eligibility_checks')) {
                $table->jsonb('eligibility_checks')->nullable()->after('auto_reject_narrative');
            }

            // Business info fields (stored separately for easier querying)
            if (!Schema::hasColumn('applications', 'business_name')) {
                $table->string('business_name')->nullable()->after('eligibility_checks');
            }
            if (!Schema::hasColumn('applications', 'business_type')) {
                $table->string('business_type')->nullable()->after('business_name');
            }
            if (!Schema::hasColumn('applications', 'business_age_months')) {
                $table->integer('business_age_months')->nullable()->after('business_type');
            }
            if (!Schema::hasColumn('applications', 'monthly_income')) {
                $table->decimal('monthly_income', 12, 2)->nullable()->after('business_age_months');
            }
            if (!Schema::hasColumn('applications', 'monthly_expense')) {
                $table->decimal('monthly_expense', 12, 2)->nullable()->after('monthly_income');
            }
            if (!Schema::hasColumn('applications', 'loan_purpose')) {
                $table->text('loan_purpose')->nullable()->after('monthly_expense');
            }

            // eKYC fields
            if (!Schema::hasColumn('applications', 'ekyc_face_match_score')) {
                $table->decimal('ekyc_face_match_score', 5, 2)->nullable()->after('ekyc_verified');
            }
            if (!Schema::hasColumn('applications', 'ekyc_liveness_passed')) {
                $table->boolean('ekyc_liveness_passed')->nullable()->after('ekyc_face_match_score');
            }
            if (!Schema::hasColumn('applications', 'ekyc_verified_at')) {
                $table->timestamp('ekyc_verified_at')->nullable()->after('ekyc_liveness_passed');
            }

            // Channel (officer portal vs self-service)
            if (!Schema::hasColumn('applications', 'channel')) {
                $table->string('channel')->default('officer_portal')->after('ekyc_verified_at');
                // Values: officer_portal | self_service
            }

            // OTP verification
            if (!Schema::hasColumn('applications', 'otp_verified')) {
                $table->boolean('otp_verified')->default(false)->after('channel');
            }
            if (!Schema::hasColumn('applications', 'otp_verified_at')) {
                $table->timestamp('otp_verified_at')->nullable()->after('otp_verified');
            }
        });
    }

    public function down(): void
    {
        Schema::table('applications', function (Blueprint $table) {
            $columns = [
                'submitted_at', 'decided_at', 'is_auto_rejected', 'auto_reject_narrative',
                'eligibility_checks', 'business_name', 'business_type', 'business_age_months',
                'monthly_income', 'monthly_expense', 'loan_purpose',
                'ekyc_face_match_score', 'ekyc_liveness_passed', 'ekyc_verified_at',
                'channel', 'otp_verified', 'otp_verified_at',
            ];
            foreach ($columns as $col) {
                if (Schema::hasColumn('applications', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
