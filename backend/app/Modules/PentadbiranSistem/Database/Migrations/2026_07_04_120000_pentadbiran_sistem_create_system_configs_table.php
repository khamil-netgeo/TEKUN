<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Module 12 — Pentadbiran Sistem
 * Migration: system_configs table
 * Stores key-value system configuration parameters.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('system_configs')) { Schema::create('system_configs', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('string'); // string, boolean, integer, json, secret
            $table->string('group')->default('general'); // general, email, sms, llm, security, maintenance
            $table->string('label');
            $table->text('description')->nullable();
            $table->boolean('is_sensitive')->default(false); // mask value in API response
            $table->boolean('is_readonly')->default(false);
            $table->timestamps();
        }); }
    }

    public function down(): void
    {
        Schema::dropIfExists('system_configs');
    }
};
