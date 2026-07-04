<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        if (!Schema::hasTable('applications')) { Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->string('ref_no', 30)->unique();
            $table->foreignId('branch_id')->constrained('branches');
            $table->foreignId('officer_id')->constrained('users');
            $table->string('applicant_name');
            $table->string('ic_no', 14)->unique();
            $table->string('phone', 20);
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->string('state')->nullable();
            $table->string('district')->nullable();
            $table->string('scheme'); // TEKUN Micro, Usahawan, Wanita, Belia
            $table->decimal('amount_requested', 12, 2);
            $table->integer('tenure_months');
            $table->string('purpose')->nullable();
            $table->string('sector')->nullable(); // business sector
            $table->string('race')->nullable();
            $table->string('gender')->nullable();
            $table->date('dob')->nullable();
            $table->string('status')->default('draft');
            // draft, submitted, pre_assessment, scoring, pending_approval, approved, rejected, offer_sent, disbursed
            $table->string('priority')->nullable(); // kritikal, tinggi, sederhana, normal, rendah
            $table->integer('ai_score')->nullable();
            $table->string('ai_risk_grade')->nullable(); // A, B, C, D, E
            $table->text('ai_recommendation')->nullable();
            $table->boolean('auto_rejected')->default(false);
            $table->string('auto_reject_reason')->nullable();
            $table->boolean('ccris_checked')->default(false);
            $table->boolean('ctos_checked')->default(false);
            $table->boolean('ssm_checked')->default(false);
            $table->boolean('muflis_checked')->default(false);
            $table->boolean('esyariah_checked')->default(false);
            $table->boolean('ekyc_verified')->default(false);
            $table->decimal('amount_approved', 12, 2)->nullable();
            $table->decimal('profit_rate', 5, 2)->nullable();
            $table->integer('approved_tenure')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['status', 'branch_id']);
            $table->index('ic_no');
        }); } // end if !hasTable
    }
    public function down(): void { Schema::dropIfExists('applications'); }
};