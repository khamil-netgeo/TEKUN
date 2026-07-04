<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('dashboard_snapshots')) { Schema::create('dashboard_snapshots', function (Blueprint $table) {
            $table->id();
            $table->string('snapshot_type')->default('daily'); // daily, weekly, monthly
            $table->date('snapshot_date');
            $table->decimal('total_portfolio', 20, 2)->default(0);
            $table->decimal('disbursement_volume', 20, 2)->default(0);
            $table->decimal('approval_rate', 5, 2)->default(0);
            $table->decimal('npl_ratio', 5, 2)->default(0);
            $table->decimal('collection_rate', 5, 2)->default(0);
            $table->integer('total_applications')->default(0);
            $table->integer('approved_applications')->default(0);
            $table->integer('rejected_applications')->default(0);
            $table->integer('pending_applications')->default(0);
            $table->integer('active_accounts')->default(0);
            $table->json('branch_breakdown')->nullable();
            $table->json('scheme_breakdown')->nullable();
            $table->json('state_breakdown')->nullable();
            $table->timestamps();

            $table->unique(['snapshot_type', 'snapshot_date']);
            $table->index('snapshot_date');
        }); }
    }

    public function down(): void
    {
        Schema::dropIfExists('dashboard_snapshots');
    }
};
