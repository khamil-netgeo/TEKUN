<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('api_alert_configs')) { Schema::create('api_alert_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('api_integration_id')->nullable()->constrained('api_integrations')->onDelete('cascade');
            $table->string('alert_type', 50); // latency, downtime, circuit_breaker, error_rate
            $table->integer('latency_threshold_ms')->default(1000);
            $table->integer('downtime_threshold_minutes')->default(5);
            $table->decimal('error_rate_threshold', 5, 2)->default(10.00); // percentage
            $table->boolean('notify_email')->default(true);
            $table->boolean('notify_sms')->default(false);
            $table->string('notify_email_addresses', 500)->nullable();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        }); }
    }

    public function down(): void
    {
        Schema::dropIfExists('api_alert_configs');
    }
};
