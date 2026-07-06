<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('disbursements', function (Blueprint $table) {
            if (!Schema::hasColumn('disbursements', 'ai_anomaly_flag')) {
                $table->boolean('ai_anomaly_flag')->default(false)->after('status');
            }
            if (!Schema::hasColumn('disbursements', 'ai_anomaly_reason')) {
                $table->text('ai_anomaly_reason')->nullable()->after('ai_anomaly_flag');
            }
        });
    }

    public function down(): void
    {
        Schema::table('disbursements', function (Blueprint $table) {
            $table->dropColumnIfExists('ai_anomaly_flag');
            $table->dropColumnIfExists('ai_anomaly_reason');
        });
    }
};
