<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Module 12 — Pentadbiran Sistem
 * Migration: announcements table
 * System-wide announcements with expiry and target roles.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('announcements')) { Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('body');
            $table->string('type')->default('info'); // info, warning, maintenance, critical
            $table->json('target_roles')->nullable(); // null = all roles
            $table->boolean('is_active')->default(true);
            $table->timestamp('published_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        }); }
    }

    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
