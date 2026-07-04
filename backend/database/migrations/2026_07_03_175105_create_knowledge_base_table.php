<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private bool $isPostgres;

    public function up(): void
    {
        $this->isPostgres = DB::getDriverName() === 'pgsql';

        // pgvector extension — only supported on PostgreSQL
        if ($this->isPostgres) {
            try {
                DB::statement('CREATE EXTENSION IF NOT EXISTS vector');
            } catch (\Exception $e) {
                // Extension already exists or not available
            }
        }

        if (Schema::hasTable('knowledge_base')) {
            // Table exists — ensure embedding column is present (PostgreSQL only)
            if ($this->isPostgres && !Schema::hasColumn('knowledge_base', 'embedding')) {
                try {
                    DB::statement('ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS embedding vector(1536)');
                    $this->createVectorIndex();
                } catch (\Exception $e) {
                    // Column addition failed — skip
                }
            }
            return;
        }

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

        // Add pgvector embedding column (PostgreSQL only)
        if ($this->isPostgres) {
            try {
                DB::statement('ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS embedding vector(1536)');
                $this->createVectorIndex();
            } catch (\Exception $e) {
                // pgvector not available — table works without embedding
            }
        }
    }

    private function createVectorIndex(): void
    {
        try {
            DB::statement('CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx ON knowledge_base USING hnsw (embedding vector_cosine_ops)');
        } catch (\Exception $e) {
            try {
                DB::statement('CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx ON knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)');
            } catch (\Exception $e2) {
                // Index creation failed — table still works without index
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('knowledge_base');
    }
};
