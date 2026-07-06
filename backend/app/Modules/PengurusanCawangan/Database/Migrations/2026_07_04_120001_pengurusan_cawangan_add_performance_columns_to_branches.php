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
                $table->decimal('npl_ratio', 5, 2)->default(0);
            }
            if (!Schema::hasColumn('branches', 'collection_rate')) {
                $table->decimal('collection_rate', 5, 2)->default(0)->after('npl_ratio');
            }
            if (!Schema::hasColumn('branches', 'performance_rank')) {
                $table->integer('performance_rank')->nullable()->after('collection_rate');
            }
            if (!Schema::hasColumn('branches', 'target_collection_rate')) {
                $table->decimal('target_collection_rate', 5, 2)->default(95.00)->after('performance_rank');
            }
            if (!Schema::hasColumn('branches', 'monthly_target')) {
                $table->decimal('monthly_target', 15, 2)->default(0)->after('target_collection_rate');
            }
            if (!Schema::hasColumn('branches', 'monthly_actual')) {
                $table->decimal('monthly_actual', 15, 2)->default(0)->after('monthly_target');
            }
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumnIfExists('npl_ratio');
            $table->dropColumnIfExists('collection_rate');
            $table->dropColumnIfExists('performance_rank');
            $table->dropColumnIfExists('target_collection_rate');
            $table->dropColumnIfExists('monthly_target');
            $table->dropColumnIfExists('monthly_actual');
        });
    }
};