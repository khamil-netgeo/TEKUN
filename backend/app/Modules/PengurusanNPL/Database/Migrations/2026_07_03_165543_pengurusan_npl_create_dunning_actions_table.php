<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        if (Schema::hasTable('dunning_actions')) {
            return;
        }
        Schema::create('dunning_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts');
            $table->string('action_type'); // notis1, notis2, notis3, call, legal, waiver
            $table->string('channel')->nullable(); // sms, email, whatsapp, post
            $table->string('status')->default('sent'); // sent, delivered, responded, failed
            $table->text('notes')->nullable();
            $table->boolean('is_automated')->default(true);
            $table->foreignId('actioned_by')->nullable()->constrained('users');
            $table->timestamp('actioned_at')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('dunning_actions'); }
};