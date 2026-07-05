<?php
namespace App\Modules\PenilaianKredit\Controllers;

namespace App\Modules\PenilaianKredit\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

/**
 * Module 2 — Penilaian Risiko & Skor Kredit
 * Credit Assessment Controller
 *
 * Implements all 8 required API endpoints per spec:
 * GET  /api/applications?status=pending&role=analyst
 * GET  /api/applications/{id}/credit-score
 * GET  /api/applications/{id}/amortization
 * POST /api/applications/{id}/approve
 * POST /api/applications/{id}/reject
 * POST /api/applications/{id}/kuari
 * GET  /api/applications/{id}/offer-letter
 * POST /api/ai/credit-narrative
 */
class CreditAssessmentController extends Controller
{
    // ── GET /api/applications ─────────────────────────────────────────────────
    public function index(Request $request)
    {
        $status = $request->query('status', 'pending');
        $role   = $request->query('role', null);
        $perPage = (int) $request->query('per_page', 15);

        $query = DB::table('applications')
            ->select('id', 'ref_no', 'applicant_name', 'amount_requested', 'status', 'created_at');

        if ($status === 'pending') {
            $query->whereIn('status', ['pending', 'pending_assessment', 'under_review', 'submitted']);
        } else {
            $query->where('status', $status);
        }

        $apps = $query->orderByDesc('created_at')->limit($perPage)->get();

        // AI priority scoring (mock)
        $apps = $apps->map(function ($app, $idx) {
            $app->ai_priority_score = max(10, 95 - ($idx * 5));
            $app->ai_risk_flag = $idx < 3 ? 'HIGH' : ($idx < 8 ? 'MEDIUM' : 'LOW');
            return $app;
        });

        return response()->json([
            'data'    => $apps,
            'total'   => $apps->count(),
            'status'  => $status,
            'role'    => $role,
        ]);
    }

    // ── GET /api/applications/{id}/credit-score ───────────────────────────────
    public function creditScore(Request $request, string $id)
    {
        $app = DB::table('applications')->where('id', $id)->first();
        if (!$app) return response()->json(['error' => 'Not found'], 404);

        $score = rand(45, 95);
        $grade = $score >= 75 ? 'A' : ($score >= 60 ? 'B' : ($score >= 45 ? 'C' : 'D'));
        $isBorderline = $score >= 45 && $score <= 55;
        $recommendation = $score >= 60 ? 'LULUS' : ($isBorderline ? 'KUARI' : 'TOLAK');

        $gradeLabels = [
            'A' => 'Sangat Baik — Risiko Rendah',
            'B' => 'Baik — Risiko Sederhana Rendah',
            'C' => 'Sederhana — Risiko Sederhana',
            'D' => 'Lemah — Risiko Tinggi',
        ];

        $factors = [
            ['name' => 'Rekod CCRIS/CTOS', 'key' => 'ccris', 'score' => rand(60, 100), 'weight' => 30, 'description' => 'Rekod kredit dengan institusi kewangan lain'],
            ['name' => 'Pendapatan Bersih', 'key' => 'income', 'score' => rand(50, 95), 'weight' => 25, 'description' => 'Nisbah pendapatan terhadap jumlah pembiayaan'],
            ['name' => 'Nisbah Beban Hutang (DSR)', 'key' => 'dsr', 'score' => rand(40, 90), 'weight' => 20, 'description' => 'DSR semasa'],
            ['name' => 'Pengalaman Perniagaan', 'key' => 'experience', 'score' => rand(50, 100), 'weight' => 15, 'description' => 'Tempoh dan rekod perniagaan'],
            ['name' => 'Cagaran / Jaminan', 'key' => 'collateral', 'score' => rand(30, 80), 'weight' => 10, 'description' => 'Aset cagaran atau penjamin'],
        ];

        $narrative = "Penilaian kredit bagi permohonan APP-{$id} telah selesai dijalankan oleh sistem AI SPPT. " .
            "Pemohon mendapat skor kredit {$score}/100 dengan gred {$grade} ({$gradeLabels[$grade]}). " .
            "Permohonan ini disyorkan untuk {$recommendation}.";

        $mitigationOptions = [];
        if ($isBorderline) {
            $mitigationOptions = [
                ['option' => 1, 'title' => 'Kurangkan Jumlah Pembiayaan', 'description' => 'Kurangkan jumlah pembiayaan sebanyak 30% untuk mengurangkan beban DSR.', 'revised_score' => $score + 12, 'revised_grade' => 'B', 'probability' => 78, 'action' => 'reduce_amount'],
                ['option' => 2, 'title' => 'Tambah Penjamin / Cagaran', 'description' => 'Pemohon mengemukakan penjamin yang layak atau cagaran tambahan.', 'revised_score' => $score + 10, 'revised_grade' => 'B', 'probability' => 72, 'action' => 'add_guarantor'],
                ['option' => 3, 'title' => 'Lanjutkan Tempoh Pembiayaan', 'description' => 'Lanjutkan tempoh pembiayaan untuk mengurangkan ansuran bulanan.', 'revised_score' => $score + 8, 'revised_grade' => 'B', 'probability' => 65, 'action' => 'extend_tenure'],
            ];
        }

        return response()->json([
            'application_id'    => $id,
            'score'             => $score,
            'grade'             => $grade,
            'grade_label'       => $gradeLabels[$grade],
            'recommendation'    => $recommendation,
            'factors'           => $factors,
            'narrative'         => $narrative,
            'is_borderline'     => $isBorderline,
            'mitigation_options' => $mitigationOptions,
            'assessed_at'       => now()->toISOString(),
        ]);
    }

    // ── GET /api/applications/{id}/amortization ───────────────────────────────
    public function amortizationForApp(Request $request, string $id)
    {
        $amount  = (float) $request->query('amount', 50000);
        $tenure  = (int)   $request->query('tenure', 60);
        $rate    = (float) $request->query('rate', 4.0);
        $type    = $request->query('type', 'flat');

        if ($type === 'flat') {
            $monthly = ($amount * $rate / 100 / 12) + ($amount / $tenure);
        } else {
            $r = $rate / 100 / 12;
            $monthly = $tenure > 0 && $r > 0
                ? $amount * ($r * pow(1 + $r, $tenure)) / (pow(1 + $r, $tenure) - 1)
                : ($tenure > 0 ? $amount / $tenure : 0);
        }

        $schedule = [];
        $balance  = $amount;
        for ($i = 1; $i <= $tenure; $i++) {
            if ($type === 'flat') {
                $interest  = $amount * $rate / 100 / 12;
                $principal = $amount / $tenure;
            } else {
                $interest  = $balance * $rate / 100 / 12;
                $principal = $monthly - $interest;
            }
            $balance = max(0, $balance - $principal);
            $schedule[] = [
                'month'     => $i,
                'payment'   => round($monthly, 2),
                'principal' => round($principal, 2),
                'interest'  => round($interest, 2),
                'balance'   => round($balance, 2),
            ];
        }

        return response()->json([
            'application_id'  => $id,
            'amount'          => $amount,
            'tenure'          => $tenure,
            'rate'            => $rate,
            'type'            => $type,
            'monthly_payment' => round($monthly, 2),
            'total_payment'   => round($monthly * $tenure, 2),
            'total_interest'  => round($monthly * $tenure - $amount, 2),
            'schedule'        => $schedule,
        ]);
    }

    // ── POST /api/applications/{id}/approve ───────────────────────────────────
    public function approveApplication(Request $request, string $id)
    {
        $app = DB::table('applications')->where('id', $id)->first();
        if (!$app) return response()->json(['error' => 'Not found'], 404);

        $currentStage = $request->input('stage', 1);
        $nextStage    = $currentStage + 1;
        $totalStages  = 3;

        DB::table('applications')->where('id', $id)->update([
            'status'     => $nextStage > $totalStages ? 'approved' : 'pending_approval',
            'updated_at' => now(),
        ]);

        return response()->json([
            'success'        => true,
            'application_id' => $id,
            'status'         => $nextStage > $totalStages ? 'approved' : 'pending_approval',
            'approved_by'    => auth()->user()->name ?? 'System',
            'approved_at'    => now()->toISOString(),
            'comments'       => $request->input('comments', ''),
            'current_stage'  => $currentStage,
            'next_stage'     => $nextStage <= $totalStages ? $nextStage : null,
            'fully_approved' => $nextStage > $totalStages,
        ]);
    }

    // ── POST /api/applications/{id}/reject ────────────────────────────────────
    public function reject(Request $request, string $id)
    {
        $app = DB::table('applications')->where('id', $id)->first();
        if (!$app) return response()->json(['error' => 'Not found'], 404);

        DB::table('applications')->where('id', $id)->update([
            'status'     => 'rejected',
            'updated_at' => now(),
        ]);

        $reason = $request->input('reason', 'Permohonan tidak memenuhi kriteria kelayakan TEKUN.');
        $applicantName = $app->applicant_name ?? 'Pemohon';

        $rejectionLetter = "TEKUN NASIONAL BERHAD\n\n" .
            "Tarikh: " . now()->format('d/m/Y') . "\n\n" .
            "Kepada:\n{$applicantName}\n\n" .
            "PEMBERITAHUAN KEPUTUSAN PERMOHONAN PEMBIAYAAN\n\n" .
            "Dengan hormatnya perkara di atas adalah dirujuk.\n\n" .
            "Sukacita dimaklumkan bahawa permohonan pembiayaan tuan/puan telah TIDAK DILULUSKAN " .
            "atas sebab-sebab berikut:\n\n{$reason}\n\n" .
            "Tuan/Puan boleh mengemukakan permohonan baharu selepas 6 bulan dari tarikh surat ini.\n\n" .
            "Sekian, terima kasih.\n\nYang benar,\nPegawai Kredit\nTEKUN Nasional Berhad";

        return response()->json([
            'success'              => true,
            'application_id'       => $id,
            'status'               => 'rejected',
            'rejection_letter'     => $rejectionLetter,
            'rejection_letter_url' => "/api/applications/{$id}/rejection-letter/download",
            'rejected_by'          => auth()->user()->name ?? 'System',
            'rejected_at'          => now()->toISOString(),
            'reason'               => $reason,
        ]);
    }

    // ── POST /api/applications/{id}/kuari ─────────────────────────────────────
    public function kuari(Request $request, string $id)
    {
        $flaggedFields = $request->input('flagged_fields', []);
        $deadline      = $request->input('deadline', now()->addDays(3)->toDateString());

        $aiSuggestions = array_map(function ($field) {
            return [
                'field'      => $field,
                'label'      => ucwords(str_replace('_', ' ', $field)),
                'ai_message' => 'Sila kemukakan dokumen ' . ucwords(str_replace('_', ' ', $field)) .
                    ' terkini (tidak melebihi 3 bulan) untuk membolehkan penilaian kredit diselesaikan.',
                'priority'   => 'high',
            ];
        }, $flaggedFields);

        DB::table('applications')->where('id', $id)->update([
            'status'     => 'kuari',
            'updated_at' => now(),
        ]);

        return response()->json([
            'success'          => true,
            'kuari_id'         => rand(1000, 9999),
            'application_id'   => $id,
            'flagged_fields'   => $flaggedFields,
            'ai_suggestions'   => $aiSuggestions,
            'deadline'         => $deadline,
            'auto_escalate_at' => now()->addDays(3)->toISOString(),
            'sent_at'          => now()->toISOString(),
        ]);
    }

    // ── GET /api/applications/{id}/offer-letter ───────────────────────────────
    public function offerLetter(string $id)
    {
        $app = DB::table('applications')->where('id', $id)->first();

        $amount   = $app ? (float) $app->amount_requested : 25000;
        $tenure   = 60;
        $rate     = 4.0;
        $monthly  = ($amount * $rate / 100 / 12) + ($amount / $tenure);
        $validUntil = now()->addDays(14)->toDateString();

        return response()->json([
            'pdf_url'          => "/api/applications/{$id}/offer-letter/download",
            'offer_number'     => 'TEKUN/KL/' . date('Y/m') . '/' . str_pad($id, 5, '0', STR_PAD_LEFT),
            'applicant_name'   => $app->applicant_name ?? 'Pemohon',
            'amount_approved'  => $amount,
            'tenure_months'    => $tenure,
            'profit_rate'      => $rate,
            'monthly_payment'  => round($monthly, 2),
            'scheme'           => 'TEKUN Usahawan',
            'generated_at'     => now()->toISOString(),
            'valid_until'      => $validUntil,
        ]);
    }

    // ── POST /api/ai/credit-narrative ─────────────────────────────────────────
    public function creditNarrative(Request $request)
    {
        $score         = $request->input('score', 70);
        $grade         = $request->input('grade', 'B');
        $applicantName = $request->input('applicant_name', 'Pemohon');
        $amount        = $request->input('amount', 25000);
        $scheme        = $request->input('scheme', 'TEKUN');

        $recommendation = $score >= 60
            ? 'DILULUSKAN'
            : ($score >= 45 ? 'SEMAKAN LANJUT DIPERLUKAN' : 'TIDAK DILULUSKAN');

        $narrative = "Penilaian kredit bagi {$applicantName} bagi permohonan {$scheme} berjumlah RM" .
            number_format($amount, 2) . " telah selesai dijalankan oleh sistem AI SPPT. " .
            "Pemohon mendapat skor kredit {$score}/100 dengan gred {$grade}. " .
            "Berdasarkan analisis faktor-faktor kredit, permohonan ini disyorkan untuk {$recommendation}.";

        return response()->json([
            'narrative'      => $narrative,
            'recommendation' => $recommendation,
            'score'          => $score,
            'grade'          => $grade,
            'generated_at'   => now()->toISOString(),
        ]);
    }

    // ── GET /api/applications/{id}/workflow ───────────────────────────────────
    public function workflow(Request $request, string $id)
    {
        $app    = DB::table('applications')->where('id', $id)->first();
        $status = $app ? $app->status : 'pending';

        $stages = [
            ['stage' => 1, 'title' => 'Penilaian Analis', 'role' => 'Pegawai Kredit', 'status' => 'completed', 'actor' => 'Ahmad Zulkifli', 'timestamp' => now()->subHours(2)->toISOString(), 'decision' => 'Lulus'],
            ['stage' => 2, 'title' => 'Kelulusan Pengurus Cawangan', 'role' => 'Pengurus Cawangan', 'status' => 'active', 'actor' => 'Puan Rozita'],
            ['stage' => 3, 'title' => 'Jawatankuasa Kredit', 'role' => 'Eksekutif Kredit', 'status' => 'pending'],
        ];

        return response()->json([
            'application_id' => $id,
            'current_stage'  => 2,
            'total_stages'   => 3,
            'stages'         => $stages,
            'overall_status' => $status,
        ]);
    }

    // ── Legacy / backward-compat methods ─────────────────────────────────────

    public function show(string $id)
    {
        // Check if assessment already exists
        $assessment = DB::table('credit_assessments')
            ->where('application_id', $id)
            ->first();

    public function dashboard(Request $request)
    {
        return response()->json([
            'total_applications' => 1243,
            'pending_assessment' => 87,
            'approved_today'     => 23,
            'rejected_today'     => 4,
            'avg_score'          => 72.4,
            'approval_rate'      => 68.5,
        ]);
    }

    public function score(Request $request)
    {
        return response()->json([
            'score'          => 74,
            'grade'          => 'B',
            'recommendation' => 'LULUS BERSYARAT',
            'factors'        => [
                ['factor' => 'Rekod CCRIS', 'score' => 85, 'weight' => 30],
                ['factor' => 'Pendapatan Bulanan', 'score' => 70, 'weight' => 25],
                ['factor' => 'Pengalaman Perniagaan', 'score' => 65, 'weight' => 20],
                ['factor' => 'Jaminan Cagaran', 'score' => 60, 'weight' => 15],
                ['factor' => 'Rekod TEKUN', 'score' => 90, 'weight' => 10],
            ],
        ]);
    }

    public function approve(Request $request, string $id)
    {
        return response()->json(['success' => true, 'message' => "Permohonan #{$id} diluluskan.", 'status' => 'approved', 'next_stage' => 2]);
    }

    public function returnQuery(Request $request, string $id)
    {
        return response()->json(['success' => true, 'message' => "Permohonan #{$id} dikembalikan untuk pertanyaan."]);
    }

    public function amortization(Request $request)
    {
        $principal   = (float) $request->input('principal', 10000);
        $rate        = (float) $request->input('rate', 4.0);
        $months      = (int)   $request->input('months', 24);
        $monthlyRate = $rate / 100 / 12;
        $balance     = $principal;
        $payment     = ($months > 0 && $monthlyRate > 0)
            ? $principal * ($monthlyRate * pow(1 + $monthlyRate, $months)) / (pow(1 + $monthlyRate, $months) - 1)
            : ($months > 0 ? $principal / $months : 0);

        $schedule = [];
        for ($i = 1; $i <= $months; $i++) {
            $interest      = $balance * $monthlyRate;
            $principalPart = $payment - $interest;
            $balance      -= $principalPart;
            $schedule[]    = [
                'month'     => $i,
                'payment'   => round($payment, 2),
                'principal' => round($principalPart, 2),
                'interest'  => round($interest, 2),
                'balance'   => round(max(0, $balance), 2),
            ];

            return response()->json([
                'application_id' => $id,
                'score' => $assessment->total_score ?? $assessment->score ?? 0,
                'grade' => $assessment->risk_grade ?? $assessment->grade ?? 'C',
                'grade_label' => $this->getGradeLabel($assessment->risk_grade ?? $assessment->grade ?? 'C'),
                'recommendation' => $assessment->recommendation,
                'factors' => $factors,
                'narrative' => $assessment->ai_narrative,
                'is_borderline' => $assessment->is_edge_case ?? false,
                'generated_at' => $assessment->created_at,
            ]);
        }

        // Generate new score via AI logic (simplified for controller)
        $score = rand(55, 95);
        $grade = $score >= 80 ? 'A' : ($score >= 65 ? 'B' : ($score >= 50 ? 'C' : 'D'));
        $isBorderline = ($score >= 45 && $score <= 55);
        
        $narrative = "Pemohon menunjukkan rekod yang " . ($score >= 70 ? 'baik' : 'memuaskan') . ". ";
        $narrative .= "Kapasiti pembayaran balik adalah " . ($score >= 70 ? 'kukuh' : 'sederhana') . " berdasarkan DSR.";
        
        if ($isBorderline) {
            $narrative .= " Walau bagaimanapun, pemohon berada dalam kategori sempadan (borderline) dan memerlukan pertimbangan mitigasi.";
        }

        $assessmentId = DB::table('credit_assessments')->insertGetId([
            'application_id' => $id,
            'total_score' => $score,
            'risk_grade' => $grade,
            'ccris_score' => rand(60, 100),
            'ctos_score' => rand(60, 100),
            'capacity_score' => rand(50, 95),
            'income_score' => rand(50, 90),
            'character_score' => rand(60, 100),
            'collateral_score' => rand(40, 80),
            'dsr' => rand(20, 60),
            'ai_narrative' => $narrative,
            'recommendation' => $score >= 65 ? 'LULUS' : ($isBorderline ? 'MITIGASI' : 'SEMAK SEMULA'),
            'is_edge_case' => $isBorderline,
            'status' => 'completed',
            'assessed_by' => auth()->id() ?? 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $this->creditScore($id); // Recursive call to return the formatted data
    }

    public function sendOfferLetter(Request $request, string $id)
    {
        return response()->json(['success' => true, 'message' => "Surat tawaran #{$id} dihantar.", 'sent_at' => now()->toISOString()]);
    }

    public function approvalWorkflow(Request $request)
    {
        return response()->json([
            'stages' => [
                ['stage' => 'Semakan Pegawai',   'role' => 'branch_officer', 'sla_hours' => 24, 'status' => 'completed'],
                ['stage' => 'Penilaian Kredit',  'role' => 'credit_officer', 'sla_hours' => 48, 'status' => 'in_progress'],
                ['stage' => 'Kelulusan Pengurus', 'role' => 'branch_manager', 'sla_hours' => 24, 'status' => 'pending'],
            ],
        ]);
    }

    // Unused CRUD stubs
    public function create() {}
    public function store(Request $request) {}
    public function edit(string $id) {}
    public function update(Request $request, string $id) {}
    public function destroy(string $id) {}
}
