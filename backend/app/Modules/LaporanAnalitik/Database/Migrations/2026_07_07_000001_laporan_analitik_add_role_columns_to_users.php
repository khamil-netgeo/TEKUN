<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Module 6 — Laporan & Analitik
 * AUDIT FIX (2026-07-07): Adds role, role_label, permissions, branch, branch_code, state
 * columns to the users table if they are missing.
 *
 * These columns exist in production but were not added via a migration.
 * This migration ensures the test DB schema matches production.
 * All additions are idempotent (guarded by hasColumn checks).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'role')) {
                $table->string('role')->nullable()->after('must_change_password');
            }
            if (!Schema::hasColumn('users', 'role_label')) {
                $table->string('role_label')->nullable()->after('role');
            }
            if (!Schema::hasColumn('users', 'permissions')) {
                $table->json('permissions')->nullable()->after('role_label');
            }
            if (!Schema::hasColumn('users', 'branch')) {
                $table->string('branch')->nullable()->after('permissions');
            }
            if (!Schema::hasColumn('users', 'branch_code')) {
                $table->string('branch_code')->nullable()->after('branch');
            }
            if (!Schema::hasColumn('users', 'state')) {
                $table->string('state')->nullable()->after('branch_code');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $columns = ['role', 'role_label', 'permissions', 'branch', 'branch_code', 'state'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('users', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
