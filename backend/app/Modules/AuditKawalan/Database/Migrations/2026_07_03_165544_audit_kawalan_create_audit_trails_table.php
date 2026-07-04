<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
    public function up(): void {
        Schema::create('audit_trails', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users');
            $table->string('action'); // create, update, approve, reject, login, etc.
            $table->string('module');
            $table->morphs('auditable');
            $table->text('old_values')->nullable(); // JSON
            $table->text('new_values')->nullable(); // JSON
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('audit_trails'); }
};