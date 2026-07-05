<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('api_integrations')) { Schema::create('api_integrations', function (Blueprint $table) {
            $table->id();
            $table->string('service_key', 50)->unique(); // e.g. esyariah, muflis, ssm, ccris, ctos, mykad
            $table->string('service_name', 100);
            $table->string('base_url', 500)->nullable();
            $table->string('description', 255)->nullable();
            $table->enum('status', ['OK', 'DEGRADED', 'DOWN', 'UNKNOWN'])->default('UNKNOWN');
            $table->integer('latency_ms')->nullable();
            $table->decimal('uptime_30d', 5, 2)->default(100.00); // percentage
            $table->enum('circuit_breaker_state', ['CLOSED', 'OPEN', 'HALF_OPEN'])->default('CLOSED');
            $table->integer('circuit_breaker_failures')->default(0);
            $table->integer('circuit_breaker_threshold')->default(5);
            $table->timestamp('circuit_breaker_opened_at')->nullable();
            $table->timestamp('last_checked_at')->nullable();
            $table->timestamp('last_success_at')->nullable();
            $table->timestamp('last_failure_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        }); }
    }

    public function down(): void
    {
        Schema::dropIfExists('api_integrations');
    }
};
