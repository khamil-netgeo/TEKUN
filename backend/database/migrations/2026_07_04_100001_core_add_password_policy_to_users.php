<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Core Foundation Migration: Password Policy Fields
 * Adds password expiry and complexity tracking per project security requirements.
 * Minimum 12 chars, complex combination, expiry every 90 days.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'password_changed_at')) {
                $table->timestamp('password_changed_at')->nullable()->after('password');
            }
            if (!Schema::hasColumn('users', 'password_expires_at')) {
                $table->timestamp('password_expires_at')->nullable()->after('password_changed_at');
            }
            if (!Schema::hasColumn('users', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('password_expires_at');
            }
            if (!Schema::hasColumn('users', 'is_suspended')) {
                $table->boolean('is_suspended')->default(false)->after('is_active');
            }
            if (!Schema::hasColumn('users', 'phone_number')) {
                $table->string('phone_number', 20)->nullable()->after('email');
            }
            if (!Schema::hasColumn('users', 'last_login_at')) {
                $table->timestamp('last_login_at')->nullable()->after('is_suspended');
            }
            if (!Schema::hasColumn('users', 'last_login_ip')) {
                $table->string('last_login_ip', 45)->nullable()->after('last_login_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'password_changed_at', 'password_expires_at',
                'is_active', 'is_suspended', 'phone_number',
                'last_login_at', 'last_login_ip',
            ]);
        });
    }
};
