<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        if (!Schema::hasTable('credit_assessments')) {
            Schema::create('credit_assessments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('application_id')->constrained('applications')->cascadeOnDelete();
                $table->foreignId('assessed_by')->constrained('users');
                $table->integer('total_score')->nullable();
                $table->string('risk_grade')->nullable();
                $table->integer('ccris_score')->nullable();
                $table->integer('ctos_score')->nullable();
                $table->integer('income_score')->nullable();
                $table->integer('character_score')->nullable();
                $table->integer('capacity_score')->nullable();
                $table->integer('collateral_score')->nullable();
                $table->decimal('monthly_income', 12, 2)->nullable();
                $table->decimal('monthly_commitment', 12, 2)->nullable();
                $table->decimal('dsr', 5, 2)->nullable();
                $table->decimal('monthly_instalment', 12, 2)->nullable();
                $table->text('amortization_schedule')->nullable();
                $table->text('ai_narrative')->nullable();
                $table->string('recommendation')->nullable();
                $table->string('status')->default('pending');
                $table->boolean('is_edge_case')->default(false);
                $table->text('edge_case_notes')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void {
        Schema::dropIfExists('credit_assessments');
    }
};
