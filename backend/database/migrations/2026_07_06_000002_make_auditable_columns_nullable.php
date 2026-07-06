<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Make auditable_type nullable to support direct audit logging
        // that does not use the LogsAuditTrail trait
        DB::statement('ALTER TABLE audit_trails ALTER COLUMN auditable_type DROP NOT NULL');
        DB::statement('ALTER TABLE audit_trails ALTER COLUMN auditable_id DROP NOT NULL');
    }

    public function down(): void
    {
        // No-op — reverting nullable is risky
    }
};
