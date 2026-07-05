<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        if (Schema::hasTable('documents')) {
            return;
        }
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('applications')->cascadeOnDelete();
            $table->string('type'); // mykad_front, mykad_back, bank_statement, ssm_cert, etc.
            $table->string('label');
            $table->string('file_path');
            $table->string('file_name');
            $table->string('mime_type')->nullable();
            $table->bigInteger('file_size')->nullable();
            $table->string('ai_status')->default('pending'); // pending, verified, manual_check, incomplete
            $table->decimal('ai_confidence', 5, 2)->nullable();
            $table->text('ai_extracted_data')->nullable(); // JSON
            $table->string('ocr_status')->nullable();
            $table->boolean('is_verified')->default(false);
            $table->foreignId('verified_by')->nullable()->constrained('users');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('documents'); }
};