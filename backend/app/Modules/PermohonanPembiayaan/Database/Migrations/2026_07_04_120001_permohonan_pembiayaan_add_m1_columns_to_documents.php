<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Module 1 — Add M1-specific columns to documents table.
 *
 * These columns support:
 *   - AI OCR tracking (ai_status, ai_confidence, ai_extracted_data, ai_issues, ocr_status)
 *   - Document verification (is_verified, verified_by, verified_at)
 *   - Storage (original_name, storage_path, file_size_bytes)
 *   - Status tracking (status: pending, processing, verified, rejected)
 *   - Upload tracking (uploaded_by)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            // AI OCR tracking
            if (!Schema::hasColumn('documents', 'ai_status')) {
                $table->string('ai_status')->nullable()->after('file_size');
                // Values: pending, processing, completed, failed
            }
            if (!Schema::hasColumn('documents', 'ai_confidence')) {
                $table->decimal('ai_confidence', 5, 2)->nullable()->after('ai_status');
            }
            if (!Schema::hasColumn('documents', 'ai_extracted_data')) {
                $table->json('ai_extracted_data')->nullable()->after('ai_confidence');
            }
            if (!Schema::hasColumn('documents', 'ocr_status')) {
                $table->string('ocr_status')->nullable()->after('ai_extracted_data');
            }

            // Document verification
            if (!Schema::hasColumn('documents', 'is_verified')) {
                $table->boolean('is_verified')->default(false)->after('ocr_status');
            }
            if (!Schema::hasColumn('documents', 'verified_by')) {
                $table->foreignId('verified_by')->nullable()->constrained('users')->after('is_verified');
            }
            if (!Schema::hasColumn('documents', 'verified_at')) {
                $table->timestamp('verified_at')->nullable()->after('verified_by');
            }

            // Storage aliases (for backward compatibility)
            if (!Schema::hasColumn('documents', 'original_name')) {
                $table->string('original_name')->nullable()->after('verified_at');
            }
            if (!Schema::hasColumn('documents', 'storage_path')) {
                $table->string('storage_path')->nullable()->after('original_name');
            }
            if (!Schema::hasColumn('documents', 'file_size_bytes')) {
                $table->bigInteger('file_size_bytes')->nullable()->after('storage_path');
            }

            // Status tracking
            if (!Schema::hasColumn('documents', 'status')) {
                $table->string('status')->default('pending')->after('file_size_bytes');
                // Values: pending, processing, verified, rejected
            }
            if (!Schema::hasColumn('documents', 'ai_issues')) {
                $table->json('ai_issues')->nullable()->after('status');
            }

            // Upload tracking
            if (!Schema::hasColumn('documents', 'uploaded_by')) {
                $table->foreignId('uploaded_by')->nullable()->constrained('users')->after('ai_issues');
            }
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $columns = [
                'ai_status', 'ai_confidence', 'ai_extracted_data', 'ocr_status',
                'is_verified', 'verified_by', 'verified_at', 'original_name',
                'storage_path', 'file_size_bytes', 'status', 'ai_issues', 'uploaded_by',
            ];
            foreach ($columns as $col) {
                if (Schema::hasColumn('documents', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
