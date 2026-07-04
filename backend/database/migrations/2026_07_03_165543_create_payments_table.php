<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        if (Schema::hasTable('payments')) {
            return;
        }
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts');
            $table->string('receipt_no', 30)->unique();
            $table->decimal('amount', 12, 2);
            $table->decimal('principal_portion', 12, 2)->default(0);
            $table->decimal('profit_portion', 12, 2)->default(0);
            $table->decimal('tawidh_portion', 12, 2)->default(0);
            $table->string('channel'); // fpx, duitnow, counter, auto_debit
            $table->string('status')->default('pending'); // pending, success, failed, reversed
            $table->string('payment_ref')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->string('processed_by')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('payments'); }
};