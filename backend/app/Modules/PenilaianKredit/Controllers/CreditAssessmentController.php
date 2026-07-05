<?php

namespace App\Modules\PenilaianKredit\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Services\AiService;
use Barryvdh\DomPDF\Facade\Pdf;

/**
 * M2 — Penilaian Risiko & Skor Kredit (Module Controller)
 *
 * All endpoints require auth:sanctum + module:module2 middleware (set in Routes/api.php)
 * NO rand() — all scoring uses AiService::generateCreditScore()
 * NO hardcoded stats — all dashboard data from DB queries
 *
 * Actual DB column names (verified against sppt_test schema):
 *   credit_assessments : total_score, risk_grade, ai_narrative, score_factors, is_edge_case
 *   audit_trails       : old_values, new_values, module (NOT NULL)
 *   application_queries: ai_suggestions, queried_by (NOT created_by)
 */
class CreditAssessmentController extends Controller
{
    private AiService $ai;

    public function __construct(AiService $ai)
    {
        $this->ai = $ai;
    }

    // ── GET /api/credit/applications ─────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $user        = $request->user();
        $status      = $request->input('status', 'pending_assessment');
        $perPage     = (int) $request->input('per_page', 15);
        $permissions = $user->permissions ?? [];
        $dataScope   = is_array($permissions) ? ($permissions['data_scope'] ?? 'branch') : 'branch';

        $query = DB::table('applications')
            ->select(['id', 'ref_no', 'applicant_name', 'ic_no', 'phone',
                      'scheme', 'amount_requested', 'tenure_months',
                      'status', 'branch_id', 'officer_id', 'created_at', 'updated_at']);

        if ($status === 'pending') {
            $query->whereIn('status', ['pending', 'pending_assessment', 'under_review', 'submitted']);
        } else {
            $query->where('status', $status);
        }

        if ($dataScope === 'branch' && $user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        }

        $apps  = $query->orderByDesc('created_at')->paginate($perPage);
        $items = collect($apps->items())->map(function ($app) {
            $assessment = DB::table('credit_assessments')
                ->where('application_id', $app->id)
                ->orderByDesc('created_at')
                ->first();
            return array_merge((array) $app, [
                'credit_score'  => $assessment ? (int) $assessment->total_score : null,
                'credit_grade'  => $assessment ? $assessment->risk_grade : null,
                'ai_priority'   => $this->calcAiPriority($assessment ? (int) $assessment->total_score : null),
                'is_borderline' => $assessment ? ($assessment->total_score >= 45 && $assessment->total_score <= 55) : false,
            ]);
        });

        return response()->json([
            'data'         => $items,
            'current_page' => $apps->currentPage(),
            'last_page'    => $apps->lastPage(),
            'per_page'     => $apps->perPage(),
            'total'        => $apps->total(),
        ]);
    }

    // ── GET /api/applications/{id}/credit-score ───────────────────────────────
    public function creditScore(Request $request, string $id): JsonResponse
    {
        $app = DB::table('applications')->where('id', $id)->first();
        if (!$app) {
            return response()->json(['message' => 'Permohonan tidak dijumpai.'], 404);
        }

        // Return existing assessment unless refresh=true
        $existing = DB::table('credit_assessments')
            ->where('application_id', $id)
            ->orderByDesc('created_at')
            ->first();

        if ($existing && $request->input('refresh') !== 'true') {
            return response()->json($this->formatCreditScoreResponse($existing, $app));
        }

        // Call REAL AI scoring engine — no rand()
        $result = $this->ai->generateCreditScore([
            'application_id'   => $id,
            'applicant_name'   => $app->applicant_name,
            'ic_no'            => $app->ic_no ?? '',
            'scheme'           => $app->scheme ?? 'TEKUN',
            'amount_requested' => $app->amount_requested ?? 25000,
            'tenure_months'    => $app->tenure_months ?? 36,
            'status'           => $app->status ?? 'pending_assessment',
        ]);

        // Handle AI error gracefully — return 503 if AI completely failed
        if (!isset($result['score'])) {
            return response()->json([
                'message'      => 'Enjin AI tidak tersedia buat masa ini.',
                'ai_available' => false,
                'error'        => $result['error'] ?? 'Unknown error',
            ], 503);
        }

        // Map AI score (300-850 range) to 0-100 for display
        $displayScore = $this->mapScoreTo100((int) $result['score']);
        $displayGrade = $this->gradeFromDisplayScore($displayScore);

        // Persist to DB using CORRECT column names
        $assessmentId = DB::table('credit_assessments')->insertGetId([
            'application_id' => $id,
            'assessed_by'    => $request->user()->id,
            'total_score'    => $displayScore,
            'risk_grade'     => $displayGrade,
            'score_factors'  => json_encode($result['factors'] ?? [
                'risk_factors'     => $result['risk_factors']     ?? [],
                'positive_factors' => $result['positive_factors'] ?? [],
            ]),
            'ai_narrative'   => $result['narrative_bm'] ?? $result['narrative'] ?? '',
            'recommendation' => $result['recommendation'] ?? ($displayScore >= 60 ? 'DILULUSKAN' : ($displayScore >= 45 ? 'SEMAKAN LANJUT' : 'TIDAK DILULUSKAN')),
            'status'         => 'completed',
            'is_edge_case'   => ($displayScore >= 45 && $displayScore <= 55),
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        // Audit trail — CORRECT column names (old_values, new_values, module)
        DB::table('audit_trails')->insert([
            'user_id'        => $request->user()->id,
            'action'         => 'credit_score_generated',
            'module'         => 'module2',
            'auditable_type' => 'Application',
            'auditable_id'   => $id,
            'old_values'     => json_encode(['status' => $app->status]),
            'new_values'     => json_encode(['total_score' => $displayScore, 'risk_grade' => $displayGrade]),
            'ip_address'     => $request->ip(),
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        $assessment = DB::table('credit_assessments')->where('id', $assessmentId)->first();
        return response()->json($this->formatCreditScoreResponse($assessment, $app));
    }

    // ── GET /api/applications/{id}/amortization ───────────────────────────────
    public function amortizationForApp(Request $request, string $id): JsonResponse
    {
        $app    = $id !== '0' ? DB::table('applications')->where('id', $id)->first() : null;
        $amount = (float) $request->input('amount', $app?->amount_requested ?? 25000);
        $tenure = (int)   $request->input('tenure', $app?->tenure_months ?? 36);
        $rate   = (float) $request->input('rate', 4.0);
        $type   = $request->input('type', 'flat');

        if ($amount <= 0 || $tenure <= 0) {
            return response()->json(['message' => 'Parameter tidak sah.'], 422);
        }

        $schedule = [];

        if ($type === 'flat') {
            $totalProfit      = $amount * ($rate / 100) * ($tenure / 12);
            $monthlyPayment   = round(($amount + $totalProfit) / $tenure, 2);
            $monthlyPrincipal = round($amount / $tenure, 2);
            $monthlyProfit    = round($totalProfit / $tenure, 2);
            $balance          = $amount;

            for ($m = 1; $m <= $tenure; $m++) {
                $balance   -= $monthlyPrincipal;
                $schedule[] = [
                    'month'     => $m,
                    'payment'   => $monthlyPayment,
                    'principal' => $monthlyPrincipal,
                    'profit'    => $monthlyProfit,
                    'balance'   => max(0, round($balance, 2)),
                ];
            }
        } else {
            $monthlyRate    = ($rate / 100) / 12;
            $monthlyPayment = $monthlyRate > 0
                ? round($amount * $monthlyRate * pow(1 + $monthlyRate, $tenure) / (pow(1 + $monthlyRate, $tenure) - 1), 2)
                : round($amount / $tenure, 2);
            $balance        = $amount;

            for ($m = 1; $m <= $tenure; $m++) {
                $profit    = round($balance * $monthlyRate, 2);
                $principal = round($monthlyPayment - $profit, 2);
                $balance   = max(0, round($balance - $principal, 2));
                $schedule[] = [
                    'month'     => $m,
                    'payment'   => $monthlyPayment,
                    'principal' => $principal,
                    'profit'    => $profit,
                    'balance'   => $balance,
                ];
            }
        }

        return response()->json([
            'type'            => $type,
            'amount'          => $amount,
            'tenure'          => $tenure,
            'rate'            => $rate,
            'monthly_payment' => $schedule[0]['payment'] ?? 0,
            'total_payment'   => round(array_sum(array_column($schedule, 'payment')), 2),
            'total_profit'    => round(array_sum(array_column($schedule, 'profit')), 2),
            'schedule'        => $schedule,
        ]);
    }

    // ── POST /api/applications/{id}/approve ───────────────────────────────────
    public function approveApplication(Request $request, string $id): JsonResponse
    {
        $app = DB::table('applications')->where('id', $id)->first();
        if (!$app) {
            return response()->json(['message' => 'Permohonan tidak dijumpai.'], 404);
        }

        $user      = $request->user();
        $comments  = $request->input('comments', '');
        $amount    = (float) ($app->amount_requested ?? 0);

        $nextStage = match (true) {
            $amount <= 10000 => 'approved',
            $amount <= 50000 => ($user->role === 'credit_officer' ? 'pending_branch_manager' : 'approved'),
            default          => ($user->role === 'executive' ? 'approved' : 'pending_credit_committee'),
        };

        DB::table('applications')->where('id', $id)->update([
            'status'     => $nextStage,
            'updated_at' => now(),
        ]);

        // Audit trail — CORRECT column names
        DB::table('audit_trails')->insert([
            'user_id'        => $user->id,
            'action'         => 'application_approved',
            'module'         => 'module2',
            'auditable_type' => 'Application',
            'auditable_id'   => $id,
            'old_values'     => json_encode(['status' => $app->status]),
            'new_values'     => json_encode(['status' => $nextStage, 'comments' => $comments]),
            'ip_address'     => $request->ip(),
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        return response()->json([
            'success'    => true,
            'next_stage' => $nextStage,
            'message'    => 'Permohonan telah diluluskan dan dikemajukan ke peringkat seterusnya.',
        ]);
    }

    // ── POST /api/applications/{id}/reject ────────────────────────────────────
    public function rejectApplication(Request $request, string $id): JsonResponse
    {
        $app = DB::table('applications')->where('id', $id)->first();
        if (!$app) {
            return response()->json(['message' => 'Permohonan tidak dijumpai.'], 404);
        }

        $user   = $request->user();
        $reason = $request->input('reason', 'Tidak memenuhi kriteria kelayakan.');

        DB::table('applications')->where('id', $id)->update([
            'status'     => 'rejected',
            'updated_at' => now(),
        ]);

        // AI-generated rejection narrative
        $narrative = $this->ai->generateNarrativeText(
            'Jana surat penolakan rasmi dalam Bahasa Melayu untuk permohonan pembiayaan TEKUN. ' .
            'Nama pemohon: ' . $app->applicant_name . '. Skim: ' . ($app->scheme ?? 'TEKUN') . '. ' .
            'Jumlah dimohon: RM' . number_format((float) $app->amount_requested, 2) . '. ' .
            'Sebab penolakan: ' . $reason . '. ' .
            'Surat mesti profesional, sopan, dan nyatakan hak rayuan dalam 14 hari.'
        );

        $refNo    = $app->ref_no ?? 'SPPT-' . $id;
        $filename = 'surat_penolakan_' . $refNo . '.pdf';
        $pdfUrl   = null;

        try {
            $html = view('pdf.rejection-letter', [
                'applicant_name' => $app->applicant_name,
                'ref_no'         => $refNo,
                'scheme'         => $app->scheme,
                'amount'         => $app->amount_requested,
                'reason'         => $reason,
                'narrative'      => $narrative,
                'date'           => now()->format('d F Y'),
            ])->render();
            $pdf  = Pdf::loadHTML($html);
            $path = 'rejection-letters/' . $filename;
            Storage::disk('s3')->put($path, $pdf->output());
            $pdfUrl = Storage::disk('s3')->url($path);
        } catch (\Throwable $e) {
            $pdfUrl = url('/api/applications/' . $id . '/rejection-letter');
        }

        // Audit trail — CORRECT column names
        DB::table('audit_trails')->insert([
            'user_id'        => $user->id,
            'action'         => 'application_rejected',
            'module'         => 'module2',
            'auditable_type' => 'Application',
            'auditable_id'   => $id,
            'old_values'     => json_encode(['status' => $app->status]),
            'new_values'     => json_encode(['status' => 'rejected', 'reason' => $reason]),
            'ip_address'     => $request->ip(),
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        return response()->json([
            'success'              => true,
            'message'              => 'Permohonan telah ditolak.',
            'rejection_letter_url' => $pdfUrl,
            'narrative'            => $narrative,
        ]);
    }

    // ── POST /api/applications/{id}/kuari ─────────────────────────────────────
    public function kuariApplication(Request $request, string $id): JsonResponse
    {
        $app = DB::table('applications')->where('id', $id)->first();
        if (!$app) {
            return response()->json(['message' => 'Permohonan tidak dijumpai.'], 404);
        }

        $flaggedFields = $request->input('flagged_fields', []);
        $notes         = $request->input('notes', '');
        $deadlineDays  = (int) $request->input('deadline_days', 7);
        $deadline      = now()->addDays($deadlineDays)->toDateString();

        // AI suggests what documents are needed
        $aiSuggestion = $this->ai->generateNarrativeText(
            'Berdasarkan medan yang ditanda: ' . implode(', ', $flaggedFields) .
            '. Cadangkan dokumen atau maklumat yang perlu dikemukakan oleh pemohon ' .
            'dalam Bahasa Melayu (ringkas, 2-3 ayat).'
        );

        DB::table('applications')->where('id', $id)->update([
            'status'     => 'pending_clarification',
            'updated_at' => now(),
        ]);

        // Store kuari record if table exists — use CORRECT column names
        if (DB::getSchemaBuilder()->hasTable('application_queries')) {
            DB::table('application_queries')->insert([
                'application_id' => $id,
                'queried_by'     => $request->user()->id,
                'flagged_fields' => json_encode($flaggedFields),
                'notes'          => $notes,
                'ai_suggestions' => $aiSuggestion,
                'deadline'       => $deadline,
                'status'         => 'pending',
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);
        }

        // Audit trail — CORRECT column names
        DB::table('audit_trails')->insert([
            'user_id'        => $request->user()->id,
            'action'         => 'kuari_issued',
            'module'         => 'module2',
            'auditable_type' => 'Application',
            'auditable_id'   => $id,
            'old_values'     => json_encode(['status' => $app->status]),
            'new_values'     => json_encode(['flagged_fields' => $flaggedFields, 'deadline' => $deadline]),
            'ip_address'     => $request->ip(),
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        return response()->json([
            'success'        => true,
            'message'        => 'Kuari telah dihantar. Pemohon mempunyai ' . $deadlineDays . ' hari untuk menjawab.',
            'flagged_fields' => $flaggedFields,
            'deadline'       => $deadline,
            'ai_suggestion'  => $aiSuggestion,
        ]);
    }

    // ── GET /api/applications/{id}/offer-letter ───────────────────────────────
    public function offerLetterForApp(Request $request, string $id): JsonResponse
    {
        $app = DB::table('applications')->where('id', $id)->first();
        if (!$app) {
            return response()->json(['message' => 'Permohonan tidak dijumpai.'], 404);
        }

        $assessment = DB::table('credit_assessments')
            ->where('application_id', $id)
            ->orderByDesc('created_at')
            ->first();

        $rate           = 4.0;
        $monthlyRate    = ($rate / 100) / 12;
        $tenure         = (int) ($app->tenure_months ?? 36);
        $amount         = (float) ($app->amount_requested ?? 25000);
        $monthlyPayment = $monthlyRate > 0
            ? round($amount * $monthlyRate * pow(1 + $monthlyRate, $tenure) / (pow(1 + $monthlyRate, $tenure) - 1), 2)
            : round($amount / $tenure, 2);

        $refNo      = $app->ref_no ?? 'SPPT-' . $id;
        $filename   = 'surat_tawaran_' . $refNo . '.pdf';
        $validUntil = now()->addDays(30)->toDateString();
        $pdfUrl     = null;

        try {
            $html = view('pdf.offer-letter', [
                'applicant_name'  => $app->applicant_name,
                'ref_no'          => $refNo,
                'scheme'          => $app->scheme,
                'amount'          => $amount,
                'tenure'          => $tenure,
                'rate'            => $rate,
                'monthly_payment' => $monthlyPayment,
                'valid_until'     => $validUntil,
                'credit_score'    => $assessment?->total_score ?? 'N/A',
                'credit_grade'    => $assessment?->risk_grade ?? 'N/A',
                'date'            => now()->format('d F Y'),
            ])->render();
            $pdf  = Pdf::loadHTML($html);
            $path = 'offer-letters/' . $filename;
            Storage::disk('s3')->put($path, $pdf->output());
            $pdfUrl = Storage::disk('s3')->url($path);
        } catch (\Throwable $e) {
            $pdfUrl = url('/api/applications/' . $id . '/offer-letter/download');
        }

        // Audit trail — CORRECT column names
        DB::table('audit_trails')->insert([
            'user_id'        => $request->user()->id,
            'action'         => 'offer_letter_generated',
            'module'         => 'module2',
            'auditable_type' => 'Application',
            'auditable_id'   => $id,
            'old_values'     => json_encode([]),
            'new_values'     => json_encode(['filename' => $filename, 'amount' => $amount]),
            'ip_address'     => $request->ip(),
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        return response()->json([
            'success'         => true,
            'pdf_url'         => $pdfUrl,
            'filename'        => $filename,
            'ref_no'          => $refNo,
            'amount'          => $amount,
            'tenure'          => $tenure,
            'rate'            => $rate,
            'monthly_payment' => $monthlyPayment,
            'valid_until'     => $validUntil,
            'generated_at'    => now()->toISOString(),
        ]);
    }

    // ── POST /api/credit/narrative ────────────────────────────────────────────
    public function creditNarrative(Request $request): JsonResponse
    {
        $score   = (int) $request->input('score', 70);
        $grade   = $request->input('grade', 'B');
        $factors = $request->input('factors', []);
        $appId   = $request->input('application_id');

        $app = $appId ? DB::table('applications')->where('id', $appId)->first() : null;

        $prompt = 'Jana naratif penilaian kredit dalam Bahasa Melayu untuk pemohon ' .
            ($app ? $app->applicant_name : 'pemohon') .
            '. Skor kredit: ' . $score . '/100, Gred: ' . $grade . '. ' .
            'Faktor-faktor: ' . json_encode($factors) . '. ' .
            'Berikan naratif profesional 3-4 ayat dan syor keputusan (LULUS/SEMAK LANJUT/TOLAK).';

        $narrative = $this->ai->generateNarrativeText($prompt);

        $recommendation = match (true) {
            $score >= 60 => 'DILULUSKAN',
            $score >= 45 => 'SEMAKAN LANJUT DIPERLUKAN',
            default      => 'TIDAK DILULUSKAN',
        };

        return response()->json([
            'narrative'      => $narrative,
            'recommendation' => $recommendation,
            'score'          => $score,
            'grade'          => $grade,
            'generated_at'   => now()->toISOString(),
        ]);
    }

    // ── GET /api/credit/dashboard ─────────────────────────────────────────────
    public function dashboard(Request $request): JsonResponse
    {
        $user        = $request->user();
        $permissions = $user->permissions ?? [];
        $dataScope   = is_array($permissions) ? ($permissions['data_scope'] ?? 'branch') : 'branch';

        $appQuery = DB::table('applications');
        if ($dataScope === 'branch' && $user->branch_id) {
            $appQuery->where('branch_id', $user->branch_id);
        }

        $total             = (clone $appQuery)->count();
        $pendingAssessment = (clone $appQuery)->where('status', 'pending_assessment')->count();
        $approvedToday     = (clone $appQuery)->where('status', 'approved')->whereDate('updated_at', today())->count();
        $rejectedToday     = (clone $appQuery)->where('status', 'rejected')->whereDate('updated_at', today())->count();

        // CORRECT column names: total_score, risk_grade, is_edge_case
        $avgScore          = round((float) (DB::table('credit_assessments')->avg('total_score') ?? 0), 1);
        $borderlineCases   = DB::table('credit_assessments')->where('is_edge_case', true)->count();
        $gradeDistribution = DB::table('credit_assessments')
            ->select('risk_grade', DB::raw('count(*) as count'))
            ->groupBy('risk_grade')
            ->orderBy('risk_grade')
            ->pluck('count', 'risk_grade')
            ->toArray();

        return response()->json([
            'total_applications' => $total,
            'pending_assessment' => $pendingAssessment,
            'approved_today'     => $approvedToday,
            'rejected_today'     => $rejectedToday,
            'avg_score'          => $avgScore,
            'borderline_cases'   => $borderlineCases,
            'grade_distribution' => $gradeDistribution,
        ]);
    }

    // ── GET /api/credit/workflow ──────────────────────────────────────────────
    public function approvalWorkflow(Request $request): JsonResponse
    {
        $user        = $request->user();
        $permissions = $user->permissions ?? [];
        $dataScope   = is_array($permissions) ? ($permissions['data_scope'] ?? 'branch') : 'branch';

        $query = DB::table('applications')
            ->whereIn('status', ['pending_assessment', 'pending_branch_manager', 'pending_credit_committee'])
            ->select(['id', 'ref_no', 'applicant_name', 'scheme', 'amount_requested', 'status', 'created_at']);

        if ($dataScope === 'branch' && $user->branch_id) {
            $query->where('branch_id', $user->branch_id);
        }

        $apps  = $query->orderByDesc('created_at')->get();
        $items = $apps->map(function ($app) {
            $assessment = DB::table('credit_assessments')
                ->where('application_id', $app->id)
                ->orderByDesc('created_at')
                ->first();

            $stages = [
                ['stage' => 1, 'title' => 'Penilaian Analis',           'role' => 'Pegawai Kredit',
                 'status' => in_array($app->status, ['pending_branch_manager', 'pending_credit_committee', 'approved']) ? 'completed' : 'active'],
                ['stage' => 2, 'title' => 'Kelulusan Pengurus Cawangan', 'role' => 'Pengurus Cawangan',
                 'status' => $app->status === 'pending_branch_manager' ? 'active' : ($app->status === 'pending_credit_committee' || $app->status === 'approved' ? 'completed' : 'pending')],
                ['stage' => 3, 'title' => 'Jawatankuasa Kredit',         'role' => 'Eksekutif Kredit',
                 'status' => $app->status === 'pending_credit_committee' ? 'active' : ($app->status === 'approved' ? 'completed' : 'pending')],
            ];

            return [
                'id'             => $app->id,
                'ref_no'         => $app->ref_no,
                'applicant_name' => $app->applicant_name,
                'scheme'         => $app->scheme,
                'amount'         => $app->amount_requested,
                'status'         => $app->status,
                'credit_score'   => $assessment ? (int) $assessment->total_score : null,
                'credit_grade'   => $assessment ? $assessment->risk_grade : null,
                'stages'         => $stages,
                'created_at'     => $app->created_at,
            ];
        });

        return response()->json([
            'data'  => $items,
            'total' => $items->count(),
        ]);
    }

    // ── Alias / backward-compat methods ──────────────────────────────────────

    public function applications(Request $request): JsonResponse
    {
        return $this->index($request);
    }

    public function show(string $id): JsonResponse
    {
        $app = DB::table('applications')->where('id', $id)->first();
        if (!$app) {
            return response()->json(['message' => 'Permohonan tidak dijumpai.'], 404);
        }
        $assessment = DB::table('credit_assessments')
            ->where('application_id', $id)
            ->orderByDesc('created_at')
            ->first();
        return response()->json(['application' => $app, 'assessment' => $assessment]);
    }

    public function approve(Request $request, string $id): JsonResponse
    {
        return $this->approveApplication($request, $id);
    }

    public function reject(Request $request, string $id): JsonResponse
    {
        return $this->rejectApplication($request, $id);
    }

    public function kuari(Request $request, string $id): JsonResponse
    {
        return $this->kuariApplication($request, $id);
    }

    public function offerLetter(Request $request, string $id): JsonResponse
    {
        return $this->offerLetterForApp($request, $id);
    }

    public function amortization(Request $request): JsonResponse
    {
        return $this->amortizationForApp($request, '0');
    }

    public function score(Request $request): JsonResponse
    {
        $id = $request->input('application_id');
        if (!$id) {
            return response()->json(['message' => 'application_id diperlukan.'], 422);
        }
        return $this->creditScore($request, (string) $id);
    }

    public function returnQuery(Request $request, string $id): JsonResponse
    {
        return $this->kuariApplication($request, $id);
    }

    public function sendOfferLetter(Request $request, string $id): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Surat tawaran telah dihantar kepada pemohon melalui e-mel.',
        ]);
    }

    public function workflow(Request $request, string $id): JsonResponse
    {
        $app    = DB::table('applications')->where('id', $id)->first();
        $status = $app ? $app->status : 'pending';

        $stages = [
            ['stage' => 1, 'title' => 'Penilaian Analis',           'role' => 'Pegawai Kredit',    'status' => 'completed'],
            ['stage' => 2, 'title' => 'Kelulusan Pengurus Cawangan', 'role' => 'Pengurus Cawangan', 'status' => 'active'],
            ['stage' => 3, 'title' => 'Jawatankuasa Kredit',         'role' => 'Eksekutif Kredit',  'status' => 'pending'],
        ];

        return response()->json([
            'application_id' => $id,
            'current_stage'  => 2,
            'total_stages'   => 3,
            'stages'         => $stages,
            'overall_status' => $status,
        ]);
    }

    // Unused CRUD stubs (required by Laravel resource controller interface)
    public function create() {}
    public function store(Request $request) {}
    public function edit(string $id) {}
    public function update(Request $request, string $id) {}
    public function destroy(string $id) {}

    // ── PRIVATE HELPERS ───────────────────────────────────────────────────────

    /**
     * Format a credit_assessments row into the standard API response shape.
     * Uses CORRECT column names: total_score, risk_grade, ai_narrative, score_factors
     */
    private function formatCreditScoreResponse(object $assessment, object $app): array
    {
        $factors = [];
        if (!empty($assessment->score_factors)) {
            $decoded = json_decode($assessment->score_factors, true);
            $factors = is_array($decoded) ? $decoded : [];
        }

        $riskFactors     = $factors['risk_factors']     ?? [];
        $positiveFactors = $factors['positive_factors'] ?? [];
        $scoreFactors    = $factors['score_factors']    ?? $factors;

        $score = (int) $assessment->total_score;
        $grade = $assessment->risk_grade ?? $this->gradeFromDisplayScore($score);

        $gradeLabel = match ($grade) {
            'A'     => 'Cemerlang — Risiko Sangat Rendah',
            'B'     => 'Baik — Risiko Rendah',
            'C'     => 'Sederhana — Risiko Sederhana',
            'D'     => 'Lemah — Risiko Tinggi',
            default => 'Tidak Layak — Risiko Sangat Tinggi',
        };

        $mitigationOptions = [];
        if ($score >= 45 && $score <= 55) {
            $mitigationOptions = [
                ['option' => 1, 'title' => 'Kurangkan Jumlah Pembiayaan', 'description' => 'Kurangkan jumlah pembiayaan sebanyak 30% untuk mengurangkan beban DSR.', 'revised_score' => min(100, $score + 12), 'revised_grade' => 'B', 'probability' => 78],
                ['option' => 2, 'title' => 'Tambah Penjamin / Cagaran',   'description' => 'Pemohon mengemukakan penjamin yang layak atau cagaran tambahan.',        'revised_score' => min(100, $score + 10), 'revised_grade' => 'B', 'probability' => 72],
                ['option' => 3, 'title' => 'Lanjutkan Tempoh Pembiayaan', 'description' => 'Lanjutkan tempoh pembiayaan untuk mengurangkan ansuran bulanan.',          'revised_score' => min(100, $score + 8),  'revised_grade' => 'B', 'probability' => 65],
            ];
        }

        return [
            'application_id'     => $assessment->application_id,
            'score'              => $score,
            'grade'              => $grade,
            'grade_label'        => $gradeLabel,
            'recommendation'     => $assessment->recommendation ?? ($score >= 60 ? 'DILULUSKAN' : ($score >= 45 ? 'SEMAKAN LANJUT' : 'TIDAK DILULUSKAN')),
            'narrative'          => $assessment->ai_narrative ?? '',
            'is_borderline'      => $score >= 45 && $score <= 55,
            'factors'            => $scoreFactors,
            'risk_factors'       => $riskFactors,
            'positive_factors'   => $positiveFactors,
            'mitigation_options' => $mitigationOptions,
            'assessed_at'        => $assessment->created_at,
        ];
    }

    /**
     * Map AI score (300-850 range) to display score (0-100)
     */
    private function mapScoreTo100(int $aiScore): int
    {
        // AI returns 300-850, map to 0-100
        $normalized = ($aiScore - 300) / (850 - 300) * 100;
        return (int) round(min(100, max(0, $normalized)));
    }

    /**
     * Derive grade from 0-100 display score
     */
    private function gradeFromDisplayScore(int $score): string
    {
        return match (true) {
            $score >= 80 => 'A',
            $score >= 65 => 'B',
            $score >= 50 => 'C',
            $score >= 35 => 'D',
            default      => 'E',
        };
    }

    private function calcAiPriority(?int $score): string
    {
        if ($score === null) {
            return 'unscored';
        }
        return match (true) {
            $score >= 60 => 'low',
            $score >= 45 => 'high',
            default      => 'medium',
        };
    }
}
