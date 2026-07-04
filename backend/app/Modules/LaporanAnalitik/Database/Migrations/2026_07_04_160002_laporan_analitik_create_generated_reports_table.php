<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('generated_reports')) { Schema::create('generated_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('generated_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('template_id')->nullable()->constrained('report_templates')->onDelete('set null');
            $table->string('report_ref')->unique(); // RPT-20260704-001
            $table->string('report_name');
            $table->string('report_type')->default('ad-hoc');
            $table->json('columns');
            $table->json('filters')->nullable();
            $table->date('date_from')->nullable();
            $table->date('date_to')->nullable();
            $table->integer('total_records')->default(0);
            $table->string('status')->default('pending'); // pending, processing, completed, failed
            $table->string('pdf_path')->nullable();
            $table->string('excel_path')->nullable();
            $table->string('pdf_url')->nullable();
            $table->string('excel_url')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index('report_ref');
            $table->index('status');
            $table->index('generated_by');
        }); }
    }

    public function down(): void
    {
        Schema::dropIfExists('generated_reports');
    }
};
