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
            $table->timestamp('password_changed_at')->nullable()->after('password');
            $table->timestamp('password_expires_at')->nullable()->after('password_changed_at');
            $table->boolean('is_active')->default(true)->after('password_expires_at');
            $table->boolean('is_suspended')->default(false)->after('is_active');
            $table->string('phone_number', 20)->nullable()->after('email');
            $table->timestamp('last_login_at')->nullable()->after('is_suspended');
            $table->string('last_login_ip', 45)->nullable()->after('last_login_at');
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
