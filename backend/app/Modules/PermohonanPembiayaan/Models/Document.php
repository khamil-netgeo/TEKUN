<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\LogsAuditTrail;

/**
 * TEKUN SPPT — Document Model
 * Represents a supporting document uploaded for an application.
 *
 * @property int    $id
 * @property int    $application_id  FK → applications.id
 * @property string $type            ic_front | ic_back | bank_statement | ssm_cert | business_photo | others
 * @property string $original_name   Original filename from user
 * @property string $storage_path    MinIO/S3 path
 * @property string $mime_type
 * @property int    $file_size_bytes
 * @property string $status          pending | verified | rejected
 * @property int    $ai_confidence   0-100 AI verification confidence score
 * @property string $ai_issues       JSON: list of AI-detected issues
 * @property int    $uploaded_by     FK → users.id
 * @property int    $verified_by     FK → users.id
 * @property string $verified_at
 */
class Document extends Model
{
    use HasFactory, LogsAuditTrail;

    protected $fillable = [
        'application_id',
        'type',
        'original_name',
        'storage_path',
        'mime_type',
        'file_size_bytes',
        'status',
        'ai_confidence',
        'ai_issues',
        'uploaded_by',
        'verified_by',
        'verified_at',
    ];

    protected $casts = [
        'ai_issues'   => 'array',
        'verified_at' => 'datetime',
    ];

    protected $auditModule = 'module1';

    // ─── Relationships ────────────────────────────────────────────────────────

    public function application()
    {
        return $this->belongsTo(Application::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeVerified($query)
    {
        return $query->where('status', 'verified');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /** Human-readable document type label in BM */
    public function getTypeLabelAttribute(): string
    {
        return match ($this->type) {
            'ic_front'       => 'MyKad (Hadapan)',
            'ic_back'        => 'MyKad (Belakang)',
            'bank_statement' => 'Penyata Bank (3 Bulan)',
            'ssm_cert'       => 'Sijil Pendaftaran Perniagaan (SSM)',
            'business_photo' => 'Gambar Premis Perniagaan',
            'others'         => 'Dokumen Lain',
            default          => $this->type,
        };
    }

    /** File size in KB */
    public function getFileSizeKbAttribute(): string
    {
        return round($this->file_size_bytes / 1024, 1) . ' KB';
    }

    /** Check if AI confidence is acceptable (>= 80%) */
    public function getIsAiApprovedAttribute(): bool
    {
        return $this->ai_confidence >= 80;
    }
}
