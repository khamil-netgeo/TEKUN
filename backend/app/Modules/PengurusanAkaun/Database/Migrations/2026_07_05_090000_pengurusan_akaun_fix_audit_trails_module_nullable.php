<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Fix: Make audit_trails.module column nullable.
     * The LogsAuditTrail trait does not set a 'module' value, causing
     * NOT NULL violations that abort transactions in PostgreSQL.
     */
    public function up(): void
    {
        // Only alter if the column exists and is NOT NULL
        if (Schema::hasColumn('audit_trails', 'module')) {
            DB::statement('ALTER TABLE audit_trails ALTER COLUMN module DROP NOT NULL');
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('audit_trails', 'module')) {
            DB::statement("ALTER TABLE audit_trails ALTER COLUMN module SET NOT NULL");
        }
    }
};
