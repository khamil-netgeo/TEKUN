<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('applications');
            $table->string('account_no', 20)->unique();
            $table->string('ic_no', 14);
            $table->string('borrower_name');
            $table->decimal('principal', 12, 2);
            $table->decimal('profit_rate', 5, 2);
            $table->integer('tenure_months');
            $table->decimal('monthly_instalment', 12, 2);
            $table->date('start_date');
            $table->date('maturity_date');
            $table->decimal('outstanding_balance', 12, 2);
            $table->decimal('total_paid', 12, 2)->default(0);
            $table->decimal('arrears_amount', 12, 2)->default(0);
            $table->integer('arrears_days')->default(0);
            $table->string('classification')->default('lancar');
            // lancar, perhatian_khusus, tidak_lancar, npl_substandard, npl_doubtful, npl_loss
            $table->decimal('tawidh_amount', 12, 2)->default(0);
            $table->boolean('moratorium_active')->default(false);
            $table->date('moratorium_end_date')->nullable();
            $table->string('status')->default('active'); // active, settled, written_off
            $table->timestamps();
            $table->index('ic_no');
            $table->index('classification');
        });
    }
    public function down(): void { Schema::dropIfExists('accounts'); }
};