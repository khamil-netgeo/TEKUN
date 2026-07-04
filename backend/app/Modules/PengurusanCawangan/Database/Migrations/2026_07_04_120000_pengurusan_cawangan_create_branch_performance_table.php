<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branch_performance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->string('period', 7);
            $table->decimal('collection_rate', 5, 2)->default(0);
            $table->decimal('npl_ratio', 5, 2)->default(0);
            $table->decimal('disbursement_amount', 15, 2)->default(0);
            $table->integer('applications_received')->default(0);
            $table->integer('applications_approved')->default(0);
            $table->integer('applications_rejected')->default(0);
            $table->decimal('target_collection_rate', 5, 2)->default(95.00);
            $table->decimal('target_disbursement', 15, 2)->default(0);
            $table->integer('performance_rank')->nullable();
            $table->timestamps();
            $table->unique(['branch_id', 'period']);
            $table->index(['period', 'performance_rank']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('branch_performance');
    }
};
