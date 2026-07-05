<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('report_templates')) { Schema::create('report_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->string('report_type')->default('ad-hoc'); // standard, ad-hoc, scheduled
            $table->json('columns')->nullable();
            $table->json('filters')->nullable();
            $table->string('group_by')->nullable();
            $table->string('sort_by')->nullable();
            $table->string('sort_direction')->default('desc');
            $table->boolean('is_scheduled')->default(false);
            $table->string('schedule_frequency')->nullable(); // daily, weekly, monthly
            $table->string('schedule_email')->nullable();
            $table->timestamp('last_generated_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('report_type');
            $table->index('created_by');
        }); }
    }

    public function down(): void
    {
        Schema::dropIfExists('report_templates');
    }
};
