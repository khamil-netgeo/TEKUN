<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('moratoriums') && !Schema::hasColumn('moratoriums', 'moratorium_type')) {
            Schema::table('moratoriums', function (Blueprint $table) {
                $table->string('moratorium_type', 50)->nullable()->after('type');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('moratoriums') && Schema::hasColumn('moratoriums', 'moratorium_type')) {
            Schema::table('moratoriums', function (Blueprint $table) {
                $table->dropColumn('moratorium_type');
            });
        }
    }
};
