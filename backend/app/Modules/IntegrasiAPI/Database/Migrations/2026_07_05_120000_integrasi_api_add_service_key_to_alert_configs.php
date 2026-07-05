<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('api_alert_configs') && !Schema::hasColumn('api_alert_configs', 'service_key')) {
            Schema::table('api_alert_configs', function (Blueprint $table) {
                $table->string('service_key', 100)->nullable()->after('id');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('api_alert_configs') && Schema::hasColumn('api_alert_configs', 'service_key')) {
            Schema::table('api_alert_configs', function (Blueprint $table) {
                $table->dropColumn('service_key');
            });
        }
    }
};
