<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_trails', function (Blueprint $table) {
            if (!Schema::hasColumn('audit_trails', 'auditable_type')) {
                $table->string('auditable_type')->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('audit_trails', 'auditable_id')) {
                $table->unsignedBigInteger('auditable_id')->nullable()->after('auditable_type');
            }
        });
    }

    public function down(): void
    {
        Schema::table('audit_trails', function (Blueprint $table) {
            $table->dropColumnIfExists('auditable_type');
            $table->dropColumnIfExists('auditable_id');
        });
    }
};
