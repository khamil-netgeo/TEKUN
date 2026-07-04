<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'role')) {
                $table->string('role')->default('applicant')->after('email');
            }
            if (!Schema::hasColumn('users', 'role_label')) {
                $table->string('role_label')->default('Pemohon')->after('role');
            }
            if (!Schema::hasColumn('users', 'branch')) {
                $table->string('branch')->nullable()->after('role_label');
            }
            if (!Schema::hasColumn('users', 'branch_code')) {
                $table->string('branch_code', 10)->nullable()->after('branch');
            }
            if (!Schema::hasColumn('users', 'state')) {
                $table->string('state')->nullable()->after('branch_code');
            }
            if (!Schema::hasColumn('users', 'permissions')) {
                $table->json('permissions')->nullable()->after('state');
            }
        });
    }
    public function down(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role','role_label','branch','branch_code','state','permissions']);
        });
    }
};
