<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('CREATE EXTENSION IF NOT EXISTS vector');

        Schema::create('knowledge_base', function (Blueprint $table) {
            $table->id();
            $table->string('category'); // skim_pembiayaan, syarat_kelayakan, proses_permohonan, faq, dasar_peraturan
            $table->string('title');
            $table->text('content');
            $table->string('language', 5)->default('ms');
            $table->string('source')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        // Add pgvector embedding column (768 dimensions for text-embedding-004)
        DB::statement('ALTER TABLE knowledge_base ADD COLUMN embedding vector(3072)');

        // Create HNSW index for fast similarity search
        DB::statement('CREATE INDEX knowledge_base_embedding_idx ON knowledge_base USING hnsw (embedding vector_cosine_ops)');
    }

    public function down(): void
    {
        Schema::dropIfExists('knowledge_base');
    }
};
