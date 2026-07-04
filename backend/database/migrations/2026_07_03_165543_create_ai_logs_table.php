<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('ai_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users');
            $table->string('module'); // module1, module2, chatbot, fraud, etc.
            $table->string('action'); // credit_score, document_check, chatbot_query, etc.
            $table->text('prompt')->nullable();
            $table->text('response')->nullable();
            $table->string('model_used')->nullable();
            $table->integer('tokens_used')->nullable();
            $table->decimal('cost_usd', 8, 6)->nullable();
            $table->integer('latency_ms')->nullable();
            $table->string('status')->default('success');
            $table->morphs('loggable'); // polymorphic: application, account, etc.
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('ai_logs'); }
};