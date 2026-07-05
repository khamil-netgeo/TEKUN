<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            if (!Schema::hasColumn('branches', 'npl_ratio')) {
                $table->decimal('npl_ratio', 5, 2)->default(0)->after('collection_rate');
            }
            if (!Schema::hasColumn('branches', 'staff_count')) {
                $table->integer('staff_count')->default(0)->after('npl_ratio');
            }
            if (!Schema::hasColumn('branches', 'total_applications')) {
                $table->integer('total_applications')->default(0)->after('staff_count');
            }
            if (!Schema::hasColumn('branches', 'total_disbursed')) {
                $table->decimal('total_disbursed', 15, 2)->default(0)->after('total_applications');
            }
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumnIfExists(['npl_ratio', 'staff_count', 'total_applications', 'total_disbursed']);
        });
    }
};
