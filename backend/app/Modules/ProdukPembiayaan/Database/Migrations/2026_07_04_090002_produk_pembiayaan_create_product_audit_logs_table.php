<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Module 9 — Produk Pembiayaan
 * Creates the product_audit_logs table for tracking all product config changes.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('product_audit_logs')) { Schema::create('product_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('financing_product_id')
                  ->constrained('financing_products')
                  ->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users');
            $table->string('action');           // updated | activated | deactivated | created
            $table->json('before')->nullable(); // snapshot before change
            $table->json('after')->nullable();  // snapshot after change
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['financing_product_id', 'created_at']);
            $table->index('user_id');
        }); }
    }

    public function down(): void
    {
        Schema::dropIfExists('product_audit_logs');
    }
};
