<?php

namespace App\Modules\PenilaianKredit\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Services\OfferLetterService;

class CreditAssessmentController extends Controller
{
    const MODULE_NAME = 'PenilaianKredit';

    public function index(Request $request)
    {
        $status = $request->query('status', 'pending_assessment');
        $perPage = $request->query('per_page', 10);

        $apps = DB::table('applications')
            ->select('id', 'ref_no', 'applicant_name', 'amount_requested', 'status', 'created_at')
            ->where('status', $status)
            ->orderByDesc('created_at')
            ->paginate($perPage);

        return response()->json($apps);
    }

    public function creditScore($id)
    {
        // Check if assessment already exists
        $assessment = DB::table('credit_assessments')
            ->where('application_id', $id)
            ->first();

        if ($assessment) {
            $factors = [
                ['name' => 'Rekod CCRIS', 'score' => $assessment->ccris_score, 'weight' => 30],
                ['name' => 'Kapasiti (DSR)', 'score' => $assessment->capacity_score ?? 80, 'weight' => 25],
                ['name' => 'Modal/Pendapatan', 'score' => $assessment->income_score ?? 75, 'weight' => 20],
                ['name' => 'Perwatakan', 'score' => $assessment->character_score ?? 85, 'weight' => 15],
                ['name' => 'Cagaran', 'score' => $assessment->collateral_score ?? 70, 'weight' => 10],
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

        $application = DB::table('applications')->where('id', $id)->first();
        if (!$application) {
            return response()->json(['message' => 'Permohonan tidak dijumpai'], 404);
        }

        try {
            $response = Http::timeout(10)
                ->withToken(config('services.scoring.token', ''))
                ->post(config('services.scoring.endpoint', 'https://api.scoring.local/v1/assess'), [
                    'application_id' => $id,
                    'ic_number' => $application->ic_number ?? '',
                    'amount_requested' => $application->amount_requested ?? 0,
                ]);

            if ($response->successful()) {
                return response()->json($response->json());
            }

            return response()->json(['message' => 'Gagal mendapatkan skor kredit'], 500);
        } catch (\Exception $e) {
            Log::error('Credit scoring error: ' . $e->getMessage());
            return response()->json(['message' => 'Ralat sistem semasa penilaian kredit'], 500);
        }
    }

    public function offerLetter($id)
    {
        $application = DB::table('applications')->where('id', $id)->first();

        if (!$application) {
            return response()->json(['message' => 'Permohonan tidak dijumpai'], 404);
        }

        // Generate or return a mock PDF URL
        $pdfUrl = url("/storage/offer-letters/offer_letter_{$id}.pdf");

        return response()->json([
            'success' => true,
            'pdf_url' => $pdfUrl
        ], 200);
    }

    private function getGradeLabel($grade)
    {
        $labels = [
            'A' => 'Cemerlang',
            'B' => 'Baik',
            'C' => 'Sederhana',
            'D' => 'Berisiko',
            'F' => 'Ditolak'
        ];
        
        return $labels[$grade] ?? 'Tidak Diketahui';
    }
}