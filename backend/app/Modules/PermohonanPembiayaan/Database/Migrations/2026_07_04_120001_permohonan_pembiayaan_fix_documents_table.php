<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Module 1 — Fix documents table to align with Document model
 * Adds: original_name, storage_path, file_size_bytes, status, ai_issues, uploaded_by
 * The existing DB has: label, file_path, file_name, file_size, ai_status, ai_extracted_data, ocr_status, is_verified
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            // Add model-aligned columns (keeping old ones for backward compat)
            if (!Schema::hasColumn('documents', 'original_name')) {
                $table->string('original_name')->nullable()->after('type');
            }
            if (!Schema::hasColumn('documents', 'storage_path')) {
                $table->string('storage_path')->nullable()->after('original_name');
            }
            if (!Schema::hasColumn('documents', 'file_size_bytes')) {
                $table->bigInteger('file_size_bytes')->nullable()->after('storage_path');
            }
            if (!Schema::hasColumn('documents', 'status')) {
                $table->string('status')->default('pending')->after('file_size_bytes');
                // pending | verified | rejected
            }
            if (!Schema::hasColumn('documents', 'ai_issues')) {
                $table->jsonb('ai_issues')->nullable()->after('ai_confidence');
            }
            if (!Schema::hasColumn('documents', 'uploaded_by')) {
                $table->foreignId('uploaded_by')->nullable()->constrained('users')->after('ai_issues');
            }
        });
    }

    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $columns = ['original_name', 'storage_path', 'file_size_bytes', 'status', 'ai_issues', 'uploaded_by'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('documents', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
