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
        'label',
        'file_path',
        'file_name',
        'original_name',
        'storage_path',
        'mime_type',
        'file_size',
        'file_size_bytes',
        'ai_status',
        'ai_confidence',
        'ai_extracted_data',
        'ai_issues',
        'ocr_status',
        'is_verified',
        'status',
        'uploaded_by',
        'verified_by',
        'verified_at',
    ];

    protected $casts = [
        'ai_extracted_data' => 'array',
        'ai_issues'         => 'array',
        'is_verified'       => 'boolean',
        'ai_confidence'     => 'decimal:2',
        'verified_at'       => 'datetime',
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
        return $query->where(function ($q) {
            $q->where('is_verified', true)->orWhere('status', 'verified')->orWhere('ai_status', 'verified');
        });
    }

    public function scopePending($query)
    {
        return $query->where(function ($q) {
            $q->where('is_verified', false)->orWhere('status', 'pending');
        });
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /** Human-readable document type label in BM */
    public function getTypeLabelAttribute(): string
    {
        return match ($this->type) {
            'ic_front'        => 'MyKad (Hadapan)',
            'ic_back'         => 'MyKad (Belakang)',
            'mykad_front'     => 'MyKad (Hadapan)',
            'mykad_back'      => 'MyKad (Belakang)',
            'bank_statement'  => 'Penyata Bank (3 Bulan)',
            'ssm_cert'        => 'Sijil Pendaftaran Perniagaan (SSM)',
            'business_photo'  => 'Gambar Premis Perniagaan',
            'income_proof'    => 'Bukti Pendapatan',
            'guarantor_ic'    => 'MyKad Penjamin',
            'others'          => 'Dokumen Lain',
            default           => $this->label ?? $this->type,
        };
    }

    /** File size in KB */
    public function getFileSizeKbAttribute(): string
    {
        $bytes = $this->file_size_bytes ?? $this->file_size ?? 0;
        return round($bytes / 1024, 1) . ' KB';
    }

    /** Effective file name */
    public function getEffectiveFileNameAttribute(): string
    {
        return $this->original_name ?? $this->file_name ?? 'unknown';
    }

    /** Effective storage path */
    public function getEffectiveStoragePathAttribute(): string
    {
        return $this->storage_path ?? $this->file_path ?? '';
    }

    /** Check if AI confidence is acceptable (>= 80%) */
    public function getIsAiApprovedAttribute(): bool
    {
        return (float) ($this->ai_confidence ?? 0) >= 80;
    }
}
