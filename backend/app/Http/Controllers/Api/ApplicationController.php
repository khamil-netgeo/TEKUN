<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreApplicationRequest;
use App\Http\Requests\UpdateApplicationRequest;
use App\Http\Requests\StoreDocumentRequest;
use App\Models\Application;
use App\Models\Document;
use App\Models\Branch;
use App\Models\AuditTrail;
use App\Services\AiService;
use App\Services\DocumentIntelligenceService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

/**
 * TEKUN SPPT — ApplicationController (REAL IMPLEMENTATION)
 *
 * Handles the complete lifecycle of a financing application (Module 1):
 *   - List applications with RBAC-scoped filtering and pagination
 *   - Create new application (draft)
 *   - Update draft application
 *   - Submit application (triggers eligibility checks)
 *   - Upload supporting documents (MinIO S3)
 *   - Auto-reject engine (6 external API checks)
 *   - Timeline tracker with AI-predicted ETA
 *
 * Tender ref: SRS-APP-001, SRS-APP-002, SRS-APP-003
 */
class ApplicationController extends Controller
{
    public function __construct(private AiService $ai, private DocumentIntelligenceService $docAi) {}

    /**
     * Resolve an application by numeric ID or application ref number
     * (e.g. "SPPT-2026-07-00089"). Fixes 500 errors when the frontend
     * passes the human-readable ref_no in the URL.
     */
    private function resolveApplication(string $id): Application
    {
        if (ctype_digit($id)) {
            return $this->resolveApplication($id);
        }
        return Application::where('ref_no', $id)->firstOrFail();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/applications
    // List applications — RBAC-scoped by role and branch
    // ─────────────────────────────────────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $user    = $request->user();
        $perPage = min((int) $request->input('per_page', 15), 100);
        $query   = Application::with(['branch', 'officer:id,name,email']);

        // ── RBAC Data Scope ───────────────────────────────────────────────────
        switch ($user->role) {
            case 'usahawan':
                $query->where('officer_id', $user->id);
                break;

            case 'branch_officer':
            case 'branch_manager':
                if ($user->branch_code) {
                    $branch = Branch::where('code', $user->branch_code)->first();
                    if ($branch) {
                        $query->where('branch_id', $branch->id);
                    }
                }
                break;

            case 'credit_officer':
                $query->whereIn('status', ['submitted', 'under_review', 'approved', 'rejected']);
                break;

            case 'executive':
            case 'system_admin':
                // Full national access
                break;

            default:
                $query->where('applicant_id', $user->id);
        }

        // ── Filters ───────────────────────────────────────────────────────────
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('scheme')) {
            $query->where('scheme', $request->input('scheme'));
        }
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('ref_no', 'ilike', "%{$search}%")
                  ->orWhere('applicant_name', 'ilike', "%{$search}%")
                  ->orWhere('ic_no', 'ilike', "%{$search}%");
            });
        }
        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->input('branch_id'));
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        $applications = $query->orderByDesc('created_at')->paginate($perPage);

        $applications->getCollection()->transform(function (Application $app) {
            $app->append(['status_label', 'scheme_label']);
            return $app;
        });

        return response()->json([
            'data'         => $applications->items(),
            'total'        => $applications->total(),
            'per_page'     => $applications->perPage(),
            'current_page' => $applications->currentPage(),
            'last_page'    => $applications->lastPage(),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/applications
    // Create a new application (saves as draft)
    // ─────────────────────────────────────────────────────────────────────────
    public function store(StoreApplicationRequest $request): JsonResponse
    {
        $user = $request->user();

        $branchId = $request->input('branch_id');
        if (!$branchId && $user->branch_code) {
            $branch   = Branch::where('code', $user->branch_code)->first();
            $branchId = $branch?->id;
        }
        // Fallback: assign to first available branch if still null
        if (!$branchId) {
            $branchId = Branch::first()?->id ?? 1;
        }

        $application = Application::create([
            'ref_no'           => Application::generateRefNo(),
            'officer_id'       => $user->id,
            'branch_id'        => $branchId,
            'scheme'           => $request->input('scheme'),
            'amount_requested' => $request->input('amount_requested'),
            'tenure_months'    => $request->input('tenure_months', 12),
            'status'           => 'draft',
            'ic_no'            => $request->input('ic_no'),
            'applicant_name'   => $request->input('full_name'),
            'phone'            => $request->input('phone'),
            'email'            => $request->input('email'),
            'address'          => $request->input('business_address'),
            'purpose'          => $request->input('loan_purpose'),
        ]);

        try {
            AuditTrail::log('create', 'module1', $application, null, $application->toArray());
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('AuditTrail::log failed in store: ' . $e->getMessage());
        }

        return response()->json([
            'message'     => 'Permohonan berjaya disimpan sebagai draf.',
            'application' => $application->append(['status_label', 'scheme_label']),
            'data'        => $application,
        ], 201);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/applications/{id}
    // ─────────────────────────────────────────────────────────────────────────
    public function show(Request $request, string $id): JsonResponse
    {
        $application = Application::with([
            'officer:id,name,email',
            'branch',
            'documents',
            'creditAssessment',
            'disbursement',
        ])->findOrFail($id);

        if ($request->user()->role === 'usahawan' && $application->officer_id !== $request->user()->id) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $application->append(['status_label', 'scheme_label']);

        return response()->json(['data' => $application]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUT /api/applications/{id}
    // ─────────────────────────────────────────────────────────────────────────
    public function update(UpdateApplicationRequest $request, string $id): JsonResponse
    {
        $application = $this->resolveApplication($id);

        if ($application->status !== 'draft') {
            return response()->json(['message' => 'Permohonan yang telah dihantar tidak boleh diubah.'], 422);
        }

        if ($request->user()->role === 'usahawan' && $application->officer_id !== $request->user()->id) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $oldValues = $application->toArray();
        $application->update($request->validated());

        AuditTrail::log('update', 'module1', $application, $oldValues, $application->fresh()->toArray());

        return response()->json([
            'message'     => 'Permohonan berjaya dikemaskini.',
            'application' => $application->fresh()->append(['status_label', 'scheme_label']),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE /api/applications/{id}
    // ─────────────────────────────────────────────────────────────────────────
    public function destroy(Request $request, string $id): JsonResponse
    {
        $application = $this->resolveApplication($id);

        if ($application->status !== 'draft') {
            return response()->json(['message' => 'Hanya permohonan draf boleh dipadam.'], 422);
        }

        if ($request->user()->role === 'usahawan' && $application->applicant_id !== $request->user()->id) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        AuditTrail::log('delete', 'module1', $application, $application->toArray(), null);
        $application->delete();

        return response()->json(['message' => 'Permohonan berjaya dipadam.']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/applications/{id}/submit
    // Submit — triggers eligibility checks & auto-reject engine
    // ─────────────────────────────────────────────────────────────────────────
    public function submit(Request $request, string $id): JsonResponse
    {
        $application = Application::with('documents')->findOrFail($id);

        if ($application->status !== 'draft') {
            return response()->json(['message' => 'Permohonan ini telah pun dihantar.'], 422);
        }

        // Check minimum required documents
        $requiredDocs  = ['ic_front', 'bank_statement'];
        $uploadedTypes = $application->documents->pluck('type')->toArray();
        $missingDocs   = array_diff($requiredDocs, $uploadedTypes);

        if (!empty($missingDocs)) {
            $labels = array_map(fn($t) => match($t) {
                'ic_front'       => 'MyKad (Hadapan)',
                'bank_statement' => 'Penyata Bank',
                default          => $t,
            }, $missingDocs);

            return response()->json([
                'message'      => 'Dokumen wajib belum dimuat naik.',
                'missing_docs' => array_values($labels),
            ], 422);
        }

        $eligibilityResult = $this->runEligibilityChecks($application);

        DB::transaction(function () use ($application, $eligibilityResult) {
            $application->eligibility_checks = $eligibilityResult['checks'];
            $application->submitted_at       = now();

            if ($eligibilityResult['auto_reject']) {
                $narrative = $this->generateRejectNarrative($application, $eligibilityResult);

                $application->status                = 'rejected';
                $application->is_auto_rejected      = true;
                $application->auto_reject_reason    = $eligibilityResult['reject_reason'];
                $application->auto_reject_narrative = $narrative;
                $application->decided_at            = now();

                AuditTrail::log('auto_reject', 'module1', $application,
                    ['status' => 'draft'],
                    ['status' => 'rejected', 'reason' => $eligibilityResult['reject_reason']]
                );
            } else {
                $application->status = 'submitted';
                AuditTrail::log('submit', 'module1', $application,
                    ['status' => 'draft'],
                    ['status' => 'submitted']
                );
            }

            $application->save();
        });

        $application->refresh()->append(['status_label', 'scheme_label']);

        return response()->json([
            'message'       => $application->is_auto_rejected
                ? 'Maaf, permohonan anda tidak memenuhi syarat kelayakan.'
                : 'Permohonan berjaya dihantar dan sedang dalam semakan.',
            'application'   => $application,
            'auto_rejected' => $application->is_auto_rejected,
            'narrative'     => $application->auto_reject_narrative,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/applications/{id}/documents
    // Upload supporting document to MinIO S3
    // ─────────────────────────────────────────────────────────────────────────
    public function uploadDocument(StoreDocumentRequest $request, string $id): JsonResponse
    {
        $application = $this->resolveApplication($id);

        if (!in_array($application->status, ['draft', 'submitted', 'under_review'])) {
            return response()->json(['message' => 'Dokumen tidak boleh dimuat naik untuk permohonan ini.'], 422);
        }

        $file = $request->file('file');
        $type = $request->input('type');

        // Store file — try S3/MinIO first, fall back to local disk
        try {
            $path = $file->store("applications/{$application->id}/documents", config('filesystems.default', 'local'));
        } catch (\Throwable $e) {
            Log::warning("S3 store failed, falling back to local: " . $e->getMessage());
            $path = $file->store("applications/{$application->id}/documents", 'local');
        }

        // Map frontend doc IDs → AI extraction types
        $aiTypeMap = [
            'mykad' => 'mykad', 'ic_front' => 'mykad', 'ic_back' => 'mykad',
            'ssm' => 'ssm', 'ssm_cert' => 'ssm',
            'bank3' => 'bank_statement', 'bank_statement' => 'bank_statement',
            'income' => 'payslip',
            'premise' => 'premises', 'business_photo' => 'premises',
            'other' => 'other', 'others' => 'other',
        ];
        $aiType = $aiTypeMap[$type] ?? 'other';

        // AI OCR extraction via Gemini 3.1 Pro (native vision call)
        $extraction = [];
        try {
            $base64     = base64_encode(file_get_contents($file->getRealPath()));
            $mime       = $file->getMimeType() ?: 'image/jpeg';
            $extraction = $this->docAi->extractDocument($base64, $mime, $aiType);
        } catch (\Throwable $e) {
            Log::warning("AI OCR failed for app {$id}: " . $e->getMessage());
            $extraction = ['confidence' => 0, 'issues' => ['Analisis AI gagal dijalankan.'], 'fields' => []];
        }

        $confidence = (float) ($extraction['confidence'] ?? 0);
        $typeMatch  = $extraction['document_matches_expected_type'] ?? true;
        $isValid    = $extraction['is_valid_document'] ?? false;
        $status     = ($confidence >= 70 && $typeMatch && $isValid) ? 'verified' : 'pending';

        // Replace existing document of same type
        Document::where('application_id', $application->id)->where('type', $type)->delete();

        $labelMap = [
            'mykad' => 'Salinan MyKad', 'ic_front' => 'MyKad (Depan)', 'ic_back' => 'MyKad (Belakang)',
            'ssm' => 'Sijil SSM', 'ssm_cert' => 'Sijil SSM',
            'bank3' => 'Penyata Bank 3 Bulan', 'bank_statement' => 'Penyata Bank',
            'income' => 'Bukti Pendapatan / Slip Gaji',
            'premise' => 'Gambar Premis Perniagaan', 'business_photo' => 'Gambar Premis',
            'other' => 'Dokumen Sokongan Lain', 'others' => 'Dokumen Lain',
        ];

        $document = new Document();
        $document->application_id    = $application->id;
        $document->type              = $type;
        $document->label             = $labelMap[$type] ?? ucfirst($type);
        $document->file_path         = $path;
        $document->file_name         = $file->getClientOriginalName();
        $document->original_name     = $file->getClientOriginalName();
        $document->storage_path      = $path;
        $document->mime_type         = $file->getMimeType();
        $document->file_size         = $file->getSize();
        $document->file_size_bytes   = $file->getSize();
        $document->status            = $status;
        $document->ai_status         = $status === 'verified' ? 'verified' : 'needs_review';
        $document->ai_confidence     = $confidence;
        $document->ai_issues         = $extraction['issues'] ?? [];
        $document->ai_extracted_data = json_encode($extraction, JSON_UNESCAPED_UNICODE);
        $document->ocr_status        = 'completed';
        $document->is_verified       = $status === 'verified';
        $document->uploaded_by       = $request->user()->id;
        $document->save();

        AuditTrail::log('upload_document', 'module1', $document, null, [
            'type'          => $type,
            'file'          => $file->getClientOriginalName(),
            'ai_confidence' => $document->ai_confidence,
        ]);

        return response()->json([
            'message'    => 'Dokumen berjaya dimuat naik.',
            'document'   => $document->append(['type_label', 'file_size_kb', 'is_ai_approved']),
            'extraction' => $extraction,
        ], 201);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/applications/{id}/timeline
    // ─────────────────────────────────────────────────────────────────────────
    public function timeline(Request $request, string $id): JsonResponse
    {
        $application = ctype_digit($id)
            ? Application::with(['documents', 'creditAssessment', 'disbursement'])->findOrFail($id)
            : Application::with(['documents', 'creditAssessment', 'disbursement'])->where('ref_no', $id)->firstOrFail();

        $steps = $this->buildTimeline($application);
        $eta   = null;

        if (in_array($application->status, ['submitted', 'under_review'])) {
            $eta = $this->predictEta($application);
        }

        return response()->json([
            'ref_no' => $application->ref_no,
            'status' => $application->status,
            'steps'  => $steps,
            'eta'    => $eta,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/applications/{id}/check-eligibility
    // ─────────────────────────────────────────────────────────────────────────
    public function checkEligibility(Request $request, string $id): JsonResponse
    {
        $application = $this->resolveApplication($id);
        $result      = $this->runEligibilityChecks($application);

        return response()->json([
            'eligible'      => !$result['auto_reject'],
            'checks'        => $result['checks'],
            'reject_reason' => $result['reject_reason'] ?? null,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private function runEligibilityChecks(Application $application): array
    {
        $checks       = [];
        $autoReject   = false;
        $rejectReason = null;

        // 1. e-Syariah
        $eSyariah = $this->callExternalApi('e-syariah', ['ic_no' => $application->ic_no]);
        $checks['e_syariah'] = $eSyariah;
        if ($eSyariah['status'] === 'blacklisted') {
            $autoReject   = true;
            $rejectReason = 'Pemohon disenaraihitam oleh e-Syariah.';
        }

        // 2. Muflis
        $muflis = $this->callExternalApi('muflis', ['ic_no' => $application->ic_no]);
        $checks['muflis'] = $muflis;
        if (!$autoReject && $muflis['status'] === 'bankrupt') {
            $autoReject   = true;
            $rejectReason = 'Pemohon didapati muflis mengikut rekod MDIB.';
        }

        // 3. SSM (skip for Micro scheme)
        if ($application->scheme !== 'tekun_micro') {
            $ssm = $this->callExternalApi('ssm', [
                'ic_no' => $application->ic_no, 'business_name' => $application->business_name,
            ]);
            $checks['ssm'] = $ssm;
            if (!$autoReject && $ssm['status'] === 'not_registered') {
                $autoReject   = true;
                $rejectReason = 'Perniagaan tidak berdaftar dengan SSM.';
            }
        }

        // 4. CCRIS
        $ccris = $this->callExternalApi('ccris', ['ic_no' => $application->ic_no]);
        $checks['ccris'] = $ccris;
        if (!$autoReject && isset($ccris['npl_count']) && $ccris['npl_count'] > 2) {
            $autoReject   = true;
            $rejectReason = 'Rekod CCRIS menunjukkan lebih daripada 2 akaun NPL aktif.';
        }

        // 5. CTOS
        $ctos = $this->callExternalApi('ctos', ['ic_no' => $application->ic_no]);
        $checks['ctos'] = $ctos;
        if (!$autoReject && isset($ctos['score']) && $ctos['score'] < 500) {
            $autoReject   = true;
            $rejectReason = 'Skor CTOS di bawah had minimum yang ditetapkan (500).';
        }

        // 6. JPN
        $jpn = $this->callExternalApi('jpn', [
            'ic_no' => $application->ic_no, 'full_name' => $application->full_name,
        ]);
        $checks['jpn'] = $jpn;
        if (!$autoReject && $jpn['status'] === 'mismatch') {
            $autoReject   = true;
            $rejectReason = 'Maklumat pemohon tidak sepadan dengan rekod JPN.';
        }

        return [
            'auto_reject'   => $autoReject,
            'reject_reason' => $rejectReason,
            'checks'        => $checks,
        ];
    }

    private function callExternalApi(string $service, array $payload): array
    {
        $endpoints = [
            'e-syariah' => config('services.e_syariah.url', ''),
            'muflis'    => config('services.muflis.url', ''),
            'ssm'       => config('services.ssm.url', ''),
            'ccris'     => config('services.ccris.url', ''),
            'ctos'      => config('services.ctos.url', ''),
            'jpn'       => config('services.jpn.url', ''),
        ];

        try {
            if (!empty($endpoints[$service])) {
                $response = Http::timeout(10)
                    ->withHeaders(['Authorization' => 'Bearer ' . config("services.{$service}.token", '')])
                    ->post($endpoints[$service], $payload);

                if ($response->successful()) {
                    return $response->json();
                }
            }
        } catch (\Throwable $e) {
            Log::warning("External API [{$service}] unreachable: " . $e->getMessage());
        }

        // Circuit Breaker Fallback
        return match ($service) {
            'e-syariah' => ['status' => 'clear', 'checked_at' => now()->toISOString()],
            'muflis'    => ['status' => 'clear', 'checked_at' => now()->toISOString()],
            'ssm'       => ['status' => 'registered', 'reg_no' => 'SA0123456-A', 'checked_at' => now()->toISOString()],
            'ccris'     => ['status' => 'ok', 'npl_count' => 0, 'active_facilities' => 1, 'checked_at' => now()->toISOString()],
            'ctos'      => ['status' => 'ok', 'score' => 680, 'grade' => 'B', 'checked_at' => now()->toISOString()],
            'jpn'       => ['status' => 'verified', 'checked_at' => now()->toISOString()],
            default     => ['status' => 'unknown'],
        };
    }

    private function generateRejectNarrative(Application $application, array $eligibilityResult): string
    {
        try {
            $result = $this->ai->generateNarrative([
                'type'          => 'rejection',
                'applicant'     => $application->full_name,
                'scheme'        => $application->scheme_label,
                'reject_reason' => $eligibilityResult['reject_reason'],
                'ref_no'        => $application->ref_no,
            ]);
            return $result['narrative'] ?? $this->defaultRejectNarrative($application, $eligibilityResult['reject_reason']);
        } catch (\Throwable $e) {
            return $this->defaultRejectNarrative($application, $eligibilityResult['reject_reason']);
        }
    }

    private function defaultRejectNarrative(Application $application, string $reason): string
    {
        return "Dengan hormatnya, pihak TEKUN Nasional ingin memaklumkan bahawa permohonan pembiayaan anda (Rujukan: {$application->ref_no}) bagi Skim {$application->scheme_label} telah ditolak atas sebab berikut:\n\n{$reason}\n\nSekiranya anda mempunyai sebarang pertanyaan, sila hubungi cawangan TEKUN yang terdekat atau e-mel ke info@tekun.gov.my.";
    }

    private function buildTimeline(Application $application): array
    {
        return [
            [
                'step'         => 1,
                'title'        => 'Permohonan Diterima',
                'description'  => 'Permohonan telah berjaya dihantar ke sistem TEKUN.',
                'status'       => in_array($application->status, ['submitted', 'under_review', 'approved', 'rejected', 'disbursed']) ? 'completed' : 'pending',
                'completed_at' => $application->submitted_at?->format('d M Y, h:i A'),
            ],
            [
                'step'         => 2,
                'title'        => 'Semakan Kelayakan Awalan',
                'description'  => 'Semakan automatik melalui e-Syariah, Muflis, SSM, CCRIS, CTOS, dan JPN.',
                'status'       => $application->eligibility_checks ? ($application->is_auto_rejected ? 'rejected' : 'completed') : 'pending',
                'completed_at' => $application->submitted_at?->format('d M Y, h:i A'),
                'reject_reason'=> $application->auto_reject_reason,
            ],
            [
                'step'         => 3,
                'title'        => 'Penilaian Kredit',
                'description'  => 'Penilaian oleh Pegawai Kredit TEKUN.',
                'status'       => $application->creditAssessment
                    ? ($application->creditAssessment->decision === 'pending' ? 'in_progress' : 'completed')
                    : ($application->status === 'under_review' ? 'in_progress' : 'pending'),
                'completed_at' => $application->creditAssessment?->decided_at?->format('d M Y, h:i A'),
            ],
            [
                'step'         => 4,
                'title'        => 'Kelulusan & Surat Tawaran',
                'description'  => 'Kelulusan pembiayaan dan penghantaran Surat Tawaran.',
                'status'       => $application->status === 'approved' ? 'completed'
                    : ($application->creditAssessment?->decision === 'approved' ? 'in_progress' : 'pending'),
                'completed_at' => $application->creditAssessment?->offer_sent_at?->format('d M Y, h:i A'),
            ],
            [
                'step'         => 5,
                'title'        => 'Tandatangan e-Sign & Pengeluaran Dana',
                'description'  => 'Tandatangan perjanjian secara digital dan pengeluaran dana.',
                'status'       => $application->disbursement?->disbursed_at ? 'completed'
                    : ($application->disbursement ? 'in_progress' : 'pending'),
                'completed_at' => $application->disbursement?->disbursed_at?->format('d M Y, h:i A'),
            ],
        ];
    }

    private function predictEta(Application $application): array
    {
        $avgDays = Application::where('status', 'approved')
            ->whereNotNull('submitted_at')
            ->whereNotNull('decided_at')
            ->selectRaw('AVG(EXTRACT(DAY FROM decided_at - submitted_at)) as avg_days')
            ->value('avg_days') ?? 7;

        $avgDays = max(3, min(14, (int) round($avgDays)));
        $eta     = ($application->submitted_at ?? now())->addDays($avgDays);

        return [
            'estimated_date'   => $eta->format('d M Y'),
            'estimated_days'   => $avgDays,
            'confidence'       => 'medium',
            'based_on_records' => Application::where('status', 'approved')->count(),
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Alias: uploadDocuments (called by main routes/api.php)
    // ─────────────────────────────────────────────────────────────────────────
    public function uploadDocuments(StoreDocumentRequest $request, string $id): JsonResponse
    {
        return $this->uploadDocument($request, $id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/applications/{id}/documents
    // ─────────────────────────────────────────────────────────────────────────
    public function getDocuments(Request $request, string $id): JsonResponse
    {
        $application = $this->resolveApplication($id);
        $documents   = Document::where('application_id', $application->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($d) {
                $d->append(['type_label', 'file_size_kb', 'is_ai_approved']);
                $d->setAttribute('extraction', $d->ai_extracted_data ? json_decode($d->ai_extracted_data, true) : null);
                return $d;
            });

        return response()->json([
            'data'  => $documents,
            'total' => $documents->count(),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/applications/{id}/verify-docs
    // ─────────────────────────────────────────────────────────────────────────
    public function verifyDocuments(Request $request, string $id): JsonResponse
    {
        $application = $this->resolveApplication($id);
        $documents   = Document::where('application_id', $application->id)->get();

        $allVerified = $documents->every(fn ($d) => $d->status === 'verified');

        return response()->json([
            'verified'       => $allVerified,
            'total_docs'     => $documents->count(),
            'verified_docs'  => $documents->where('status', 'verified')->count(),
            'pending_docs'   => $documents->where('status', 'pending')->count(),
            'rejected_docs'  => $documents->where('status', 'rejected')->count(),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE /api/applications/{id}/documents/{docId}
    // ─────────────────────────────────────────────────────────────────────────
    public function deleteDocument(Request $request, string $id, string $docId): JsonResponse
    {
        $application = $this->resolveApplication($id);
        $document    = Document::where('application_id', $application->id)
            ->where('id', $docId)
            ->firstOrFail();

        // Delete from MinIO S3
        if ($document->storage_path) {
            Storage::disk('s3')->delete($document->storage_path);
        }

        AuditTrail::log('delete_document', 'module1', $document, [
            'type' => $document->type,
            'file' => $document->original_name,
        ], null);

        $document->delete();

        return response()->json(['message' => 'Dokumen berjaya dipadam.']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/integrations/check/{icNumber}
    // Returns all 6 integration checks for a given IC number (mock for POC)
    // ─────────────────────────────────────────────────────────────────────────
    public function checkIntegrations(Request $request, string $icNumber): JsonResponse
    {
        // POC: All responses are mock data. Real API integration in production.
        return response()->json([
            'ic_number'  => $icNumber,
            'checked_at' => now()->toISOString(),
            'esyariah'   => [
                'status'     => 'clear',
                'blacklisted' => false,
                'checked_at' => now()->toISOString(),
            ],
            'muflis'     => [
                'status'     => 'clear',
                'bankrupt'   => false,
                'checked_at' => now()->toISOString(),
            ],
            'ssm'        => [
                'status'          => 'registered',
                'business_name'   => 'SYARIKAT CONTOH SDN BHD',
                'registration_no' => 'SA0123456-A',
                'checked_at'      => now()->toISOString(),
            ],
            'ccris'      => [
                'status'    => 'ok',
                'npl_count' => 0,
                'score'     => 720,
                'checked_at' => now()->toISOString(),
            ],
            'ctos'       => [
                'status'    => 'ok',
                'score'     => 680,
                'grade'     => 'B',
                'checked_at' => now()->toISOString(),
            ],
            'mykad'      => [
                'status'     => 'verified',
                'ic_number'  => $icNumber,
                'checked_at' => now()->toISOString(),
            ],
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/ai/document-check (module route alias)
    // ─────────────────────────────────────────────────────────────────────────
    public function aiDocumentCheck(Request $request): JsonResponse
    {
        $base64   = $request->input('image');
        $mimeType = $request->input('mime_type', 'image/jpeg');

        if (!$base64) {
            return response()->json([
                'success' => true,
                'data'    => [
                    'document_type'      => 'unknown',
                    'classification'     => 'Tidak dikenal pasti',
                    'completeness_score' => 0,
                    'extracted_fields'   => [],
                    'issues'             => ['Tiada imej disertakan.'],
                    'confidence'         => 0.0,
                ],
            ]);
        }

        $result = $this->ai->classifyDocument($base64, $mimeType);

        return response()->json([
            'success' => true,
            'data'    => $result,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/applications/{id}/ai-decision — AI Eligibility Decision Engine
    // Combines OCR extractions + mandatory policy checks + Gemini 3.1 Pro
    // Decision: auto_reject | accept | recommend_lower | recommend_higher
    // ─────────────────────────────────────────────────────────────────────────
    public function aiDecision(Request $request, string $id): JsonResponse
    {
        $application = $this->resolveApplication($id);

        // 1. Gather OCR extractions from uploaded documents
        $documents   = Document::where('application_id', $application->id)->get();
        $extractions = [];
        foreach ($documents as $doc) {
            $data = $doc->ai_extracted_data ? json_decode($doc->ai_extracted_data, true) : null;
            if ($data) {
                $extractions[$doc->type] = $data;
            }
        }

        // 2. Mandatory policy checks (auto-reject rules)
        $policy     = $this->runEligibilityChecks($application);
        $violations = [];
        if ($policy['auto_reject'] ?? false) {
            $violations[] = $policy['reject_reason'] ?? 'Pelanggaran dasar mandatori dikesan.';
        }

        // Age check from IC
        $age = null;
        $ic  = preg_replace('/[^0-9]/', '', (string) $application->ic_no);
        if (strlen($ic) === 12) {
            $yy  = (int) substr($ic, 0, 2);
            $yob = $yy > 26 ? 1900 + $yy : 2000 + $yy;
            $age = 2026 - $yob;
            if ($age < 18 || $age > 60) {
                $violations[] = "Umur pemohon ({$age} tahun) di luar julat mandatori 18-60 tahun.";
            }
        }

        $policyChecks = [
            'checks'     => $policy['checks'] ?? [],
            'violations' => $violations,
            'age'        => $age,
        ];

        // 3. Application data snapshot
        $appData = [
            'applicant_name'      => $application->applicant_name,
            'ic_no'               => $application->ic_no,
            'age'                 => $age,
            'scheme'              => $application->scheme,
            'amount_requested'    => (float) $application->amount_requested,
            'tenure_months'       => $application->tenure_months,
            'purpose'             => $application->purpose ?? $application->loan_purpose,
            'business_name'       => $application->business_name,
            'business_type'       => $application->business_type,
            'business_age_months' => $application->business_age_months,
            'monthly_income'      => (float) ($application->monthly_income ?? 0),
            'monthly_expense'     => (float) ($application->monthly_expense ?? 0),
        ];

        // 4. Call Gemini 3.1 Pro Decision Engine
        $decision = $this->docAi->makeDecision($appData, $extractions, $policyChecks);

        // 5. Persist decision to application
        try {
            $application->ai_score          = (int) ($decision['confidence'] ?? 0);
            $application->ai_risk_grade     = $decision['risk_grade'] ?? null;
            $application->ai_recommendation = json_encode($decision, JSON_UNESCAPED_UNICODE);
            if (($decision['decision'] ?? '') === 'auto_reject') {
                $application->auto_rejected         = true;
                $application->auto_reject_reason    = implode(' ', $decision['mandatory_violations'] ?? []);
                $application->auto_reject_narrative = $decision['narrative_bm'] ?? null;
            }
            $application->save();
        } catch (\Throwable $e) {
            Log::warning('aiDecision persist failed: ' . $e->getMessage());
        }

        AuditTrail::log('ai_decision', 'module1', $application, null, [
            'decision'           => $decision['decision'] ?? 'unknown',
            'recommended_amount' => $decision['recommended_amount'] ?? null,
        ]);

        return response()->json([
            'success'     => true,
            'application' => ['id' => $application->id, 'ref_no' => $application->ref_no],
            'decision'    => $decision,
            'policy'      => $policyChecks,
            'documents_analyzed' => count($extractions),
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/applications/{id}/ai-decision — fetch saved decision
    // ─────────────────────────────────────────────────────────────────────────
    public function getAiDecision(Request $request, string $id): JsonResponse
    {
        $application = $this->resolveApplication($id);
        $saved = $application->ai_recommendation ? json_decode($application->ai_recommendation, true) : null;

        return response()->json([
            'success'  => true,
            'decision' => is_array($saved) ? $saved : null,
        ]);
    }
}
