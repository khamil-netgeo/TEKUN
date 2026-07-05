<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('applications') && !Schema::hasColumn('applications', 'applicant_id')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->foreignId('applicant_id')->nullable()->after('officer_id')
                      ->constrained('users')->onDelete('set null');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('applications') && Schema::hasColumn('applications', 'applicant_id')) {
            Schema::table('applications', function (Blueprint $table) {
                $table->dropForeign(['applicant_id']);
                $table->dropColumn('applicant_id');
            });
        }
    }
};
