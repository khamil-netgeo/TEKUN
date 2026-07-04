<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('applicant')->after('email');
            $table->string('role_label')->default('Pemohon')->after('role');
            $table->string('branch')->nullable()->after('role_label');
            $table->string('branch_code', 10)->nullable()->after('branch');
            $table->string('state')->nullable()->after('branch_code');
            $table->json('permissions')->nullable()->after('state');
        });
    }
    public function down(): void {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role','role_label','branch','branch_code','state','permissions']);
        });
    }
};
