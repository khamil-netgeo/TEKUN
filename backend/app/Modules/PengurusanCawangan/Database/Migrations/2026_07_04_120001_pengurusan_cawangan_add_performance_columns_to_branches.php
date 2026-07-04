<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            if (!Schema::hasColumn('branches', 'manager_email')) {
                $table->string('manager_email')->nullable()->after('manager_name');
            }
            if (!Schema::hasColumn('branches', 'collection_rate')) {
                $table->decimal('collection_rate', 5, 2)->default(0)->after('is_active');
            }
            if (!Schema::hasColumn('branches', 'npl_ratio')) {
                $table->decimal('npl_ratio', 5, 2)->default(0)->after('collection_rate');
            }
            if (!Schema::hasColumn('branches', 'total_applications')) {
                $table->integer('total_applications')->default(0)->after('npl_ratio');
            }
            if (!Schema::hasColumn('branches', 'active_accounts')) {
                $table->integer('active_accounts')->default(0)->after('total_applications');
            }
            if (!Schema::hasColumn('branches', 'disbursement_amount')) {
                $table->decimal('disbursement_amount', 15, 2)->default(0)->after('active_accounts');
            }
            if (!Schema::hasColumn('branches', 'monthly_target')) {
                $table->decimal('monthly_target', 15, 2)->default(0)->after('disbursement_amount');
            }
            if (!Schema::hasColumn('branches', 'monthly_actual')) {
                $table->decimal('monthly_actual', 15, 2)->default(0)->after('monthly_target');
            }
            if (!Schema::hasColumn('branches', 'staff_count')) {
                $table->integer('staff_count')->default(0)->after('monthly_actual');
            }
            if (!Schema::hasColumn('branches', 'performance_rank')) {
                $table->integer('performance_rank')->nullable()->after('staff_count');
            }
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn([
                'manager_email', 'collection_rate', 'npl_ratio',
                'total_applications', 'active_accounts', 'disbursement_amount',
                'monthly_target', 'monthly_actual', 'staff_count', 'performance_rank',
            ]);
        });
    }
};
