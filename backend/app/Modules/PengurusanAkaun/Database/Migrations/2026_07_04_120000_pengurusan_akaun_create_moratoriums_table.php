<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Module 4 — Moratorium / Restructuring Requests Table
 * Tracks all moratorium and loan restructuring requests.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('moratoriums')) { Schema::create('moratoriums', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->onDelete('cascade');
            $table->string('type')->default('moratorium'); // moratorium | restructuring | rescheduling
            $table->integer('months_requested');
            $table->text('reason');
            $table->integer('hardship_score')->default(0); // 0-100 AI score
            $table->string('ai_recommendation')->nullable(); // DISYORKAN | PERLU_SEMAKAN
            $table->string('status')->default('pending'); // pending | approved | rejected | active | completed
            $table->decimal('new_instalment', 12, 2)->nullable();
            $table->date('new_end_date')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->foreignId('submitted_by')->nullable()->constrained('users');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->index('account_id');
            $table->index('status');
        }); }
    }

    public function down(): void
    {
        Schema::dropIfExists('moratoriums');
    }
};
