<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Core Foundation Migration: OTP Codes Table
 * Supports SMS and Email OTP verification channels.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('otp_codes', function (Blueprint $table) {
            $table->id();
            $table->string('identifier');          // phone number or email
            $table->enum('channel', ['sms', 'email']);
            $table->string('code', 6);             // 6-digit OTP
            $table->string('purpose')->default('verification'); // verification, password_reset, login_2fa
            $table->boolean('is_used')->default(false);
            $table->integer('attempts')->default(0);
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->index(['identifier', 'channel', 'is_used']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('otp_codes');
    }
};
