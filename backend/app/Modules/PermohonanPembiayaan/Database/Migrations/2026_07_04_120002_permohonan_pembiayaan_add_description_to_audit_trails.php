<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Module 1 — Add missing 'description' column to audit_trails table.
 * The LogsAuditTrail trait uses this column but the core migration omitted it.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('audit_trails') && !Schema::hasColumn('audit_trails', 'description')) {
            Schema::table('audit_trails', function (Blueprint $table) {
                $table->text('description')->nullable()->after('new_values');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('audit_trails') && Schema::hasColumn('audit_trails', 'description')) {
            Schema::table('audit_trails', function (Blueprint $table) {
                $table->dropColumn('description');
            });
        }
    }
};
