<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Module 9 — Produk Pembiayaan
 * Creates the product_eligibility_rules table for the rule engine.
 * Each row is a named rule that belongs to a financing product.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('product_eligibility_rules')) { Schema::create('product_eligibility_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('financing_product_id')
                  ->constrained('financing_products')
                  ->onDelete('cascade');

            $table->string('rule_code', 50);        // e.g. AGE_MIN, GENDER_FEMALE
            $table->string('rule_name');             // Human-readable label (BM)
            $table->string('rule_name_en')->nullable();
            $table->string('rule_type');             // age | gender | sector | blacklist | document | custom
            $table->string('operator');              // gte | lte | eq | in | not_in | between
            $table->json('rule_value');              // e.g. 18, "F", ["pertanian","perniagaan"]
            $table->boolean('is_hard_reject')->default(true); // hard = auto-reject, soft = warning
            $table->string('rejection_message')->nullable();
            $table->string('rejection_message_en')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('priority')->default(100); // lower = checked first

            $table->timestamps();

            $table->unique(['financing_product_id', 'rule_code']);
            $table->index(['financing_product_id', 'is_active']);
        }); }
    }

    public function down(): void
    {
        Schema::dropIfExists('product_eligibility_rules');
    }
};
