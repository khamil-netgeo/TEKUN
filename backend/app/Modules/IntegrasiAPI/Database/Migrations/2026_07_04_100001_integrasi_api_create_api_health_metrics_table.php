<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('api_health_metrics')) { Schema::create('api_health_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('api_integration_id')->constrained('api_integrations')->onDelete('cascade');
            $table->integer('latency_ms')->nullable();
            $table->enum('status', ['OK', 'DEGRADED', 'DOWN', 'TIMEOUT', 'ERROR'])->default('UNKNOWN');
            $table->integer('http_status_code')->nullable();
            $table->text('error_message')->nullable();
            $table->boolean('is_success')->default(false);
            $table->timestamp('checked_at');
            $table->index(['api_integration_id', 'checked_at']);
        }); }
    }

    public function down(): void
    {
        Schema::dropIfExists('api_health_metrics');
    }
};
