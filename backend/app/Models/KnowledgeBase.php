<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * TEKUN SPPT — KnowledgeBase Model
 * Stores RAG knowledge chunks with pgvector embeddings for AI chatbot.
 *
 * @property int    $id
 * @property string $category     skim_pembiayaan | syarat_kelayakan | proses_permohonan | faq | dasar_peraturan
 * @property string $title
 * @property string $content      The actual text chunk
 * @property string $language     ms | en
 * @property string $source       Source document reference
 * @property vector $embedding    pgvector embedding (1536 dimensions)
 */
class KnowledgeBase extends Model
{
    use HasFactory;

    protected $table = 'knowledge_base';

    protected $fillable = [
        'category',
        'title',
        'content',
        'language',
        'source',
        'embedding',
    ];

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopeByLanguage($query, string $lang = 'ms')
    {
        return $query->where('language', $lang);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    public function getCategoryLabelAttribute(): string
    {
        return match ($this->category) {
            'skim_pembiayaan'    => 'Skim Pembiayaan',
            'syarat_kelayakan'   => 'Syarat Kelayakan',
            'proses_permohonan'  => 'Proses Permohonan',
            'faq'                => 'Soalan Lazim (FAQ)',
            'dasar_peraturan'    => 'Dasar & Peraturan',
            default              => $this->category,
        };
    }
}
