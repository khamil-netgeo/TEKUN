<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        if (!Schema::hasTable('npl_records')) {
            Schema::create('npl_records', function (Blueprint $table) {
                $table->id();
                $table->foreignId('account_id')->constrained('accounts');
                $table->string('classification');
                $table->integer('days_overdue');
                $table->decimal('outstanding', 12, 2);
                $table->string('ai_risk_level')->nullable();
                $table->decimal('ai_recovery_probability', 5, 2)->nullable();
                $table->text('ai_recommendation')->nullable();
                $table->date('classified_at');
                $table->timestamps();
            });
        }
    }

    public function down(): void {
        Schema::dropIfExists('npl_records');
    }
};
