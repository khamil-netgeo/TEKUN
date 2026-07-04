<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Module 9 — Produk Pembiayaan
 * Creates the financing_products table for the 4 TEKUN financing schemes.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('financing_products')) { Schema::create('financing_products', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();          // SKM-001, SKM-002, etc.
            $table->string('name');                         // TEKUN Micro, Usahawan, Wanita, Belia
            $table->string('name_en')->nullable();
            $table->text('description')->nullable();
            $table->text('description_en')->nullable();

            // Financial parameters
            $table->decimal('min_amount', 12, 2)->default(1000.00);
            $table->decimal('max_amount', 12, 2);
            $table->decimal('profit_rate', 5, 2);           // % per annum
            $table->integer('min_tenure_months')->default(6);
            $table->integer('max_tenure_months');
            $table->string('processing_fee_type')->default('fixed'); // fixed | percentage
            $table->decimal('processing_fee_value', 8, 2)->default(0.00);

            // Eligibility parameters
            $table->integer('min_age')->default(18);
            $table->integer('max_age')->default(60);
            $table->integer('min_business_age_months')->default(0);
            $table->json('eligible_sectors')->nullable();   // ["all"] or specific sectors
            $table->json('eligible_genders')->nullable();   // ["M","F"] or ["F"] for Wanita
            $table->json('eligible_races')->nullable();     // null = all
            $table->boolean('requires_ssm_registration')->default(false);
            $table->boolean('requires_business_premises')->default(false);
            $table->boolean('blacklist_check_required')->default(true);
            $table->boolean('ccris_check_required')->default(true);
            $table->boolean('ctos_check_required')->default(true);
            $table->boolean('muflis_check_required')->default(true);
            $table->boolean('esyariah_check_required')->default(false);

            // Required documents (JSON array of document type codes)
            $table->json('required_documents')->nullable();

            // Status and audit
            $table->boolean('is_active')->default(true);
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('deactivated_at')->nullable();
            $table->foreignId('activated_by')->nullable()->constrained('users');
            $table->foreignId('deactivated_by')->nullable()->constrained('users');
            $table->foreignId('last_updated_by')->nullable()->constrained('users');

            // Display
            $table->string('color_hex', 10)->default('#1B2B5E');
            $table->integer('display_order')->default(0);

            $table->timestamps();
            $table->softDeletes();

            $table->index('is_active');
            $table->index('code');
        }); }
    }

    public function down(): void
    {
        Schema::dropIfExists('financing_products');
    }
};
