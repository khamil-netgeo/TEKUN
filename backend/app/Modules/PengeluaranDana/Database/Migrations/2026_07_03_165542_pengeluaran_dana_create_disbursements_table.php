<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        if (Schema::hasTable('disbursements')) {
            return;
        }
        Schema::create('disbursements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('applications');
            $table->string('ref_no', 30)->unique();
            $table->decimal('amount', 12, 2);
            $table->string('bank_name');
            $table->string('bank_account_no', 30);
            $table->string('bank_account_name');
            $table->boolean('bank_verified')->default(false);
            $table->string('status')->default('pending');
            // pending, pending_approval, approved, processing, completed, failed
            $table->string('approval_level')->nullable(); // L1, L2, L3
            $table->foreignId('approved_by_l1')->nullable()->constrained('users');
            $table->foreignId('approved_by_l2')->nullable()->constrained('users');
            $table->foreignId('approved_by_l3')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->string('esign_status')->nullable(); // pending, signed, rejected
            $table->string('esign_ref')->nullable();
            $table->timestamp('esigned_at')->nullable();
            $table->boolean('is_batch')->default(false);
            $table->string('batch_ref')->nullable();
            $table->timestamp('disbursed_at')->nullable();
            $table->string('payment_ref')->nullable();
            $table->integer('aging_days')->default(0);
            $table->boolean('is_escalated')->default(false);
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('disbursements'); }
};