<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Module 11 — Audit & Kawalan
 * Adds description and severity columns to audit_trails for richer log context.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_trails', function (Blueprint $table) {
            if (!Schema::hasColumn('audit_trails', 'description')) {
                $table->text('description')->nullable()->after('user_agent');
            }
            if (!Schema::hasColumn('audit_trails', 'severity')) {
                $table->string('severity', 20)->nullable()->default('LOW')->after('description');
            }
        });
    }

    public function down(): void
    {
        Schema::table('audit_trails', function (Blueprint $table) {
            $table->dropColumnIfExists('description');
            $table->dropColumnIfExists('severity');
        });
    }
};
