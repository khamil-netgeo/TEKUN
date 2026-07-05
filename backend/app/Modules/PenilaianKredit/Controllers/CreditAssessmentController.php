<?php

namespace App\Modules\PenilaianKredit\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class CreditAssessmentController extends Controller
{
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

    public function amortization(Request $request, $id)
    {
        $amount = $request->query('amount', 50000);
        $tenure = $request->query('tenure', 60);
        $rate = $request->query('rate', 4.0);
        $type = $request->query('type', 'flat'); // flat or reducing

        $schedule = [];
        $balance = $amount;
        
        if ($type === 'flat') {
            $totalInterest = $amount * ($rate / 100) * ($tenure / 12);
            $totalPayment = $amount + $totalInterest;
            $monthlyPayment = $totalPayment / $tenure;
            $monthlyInterest = $totalInterest / $tenure;
            $monthlyPrincipal = $amount / $tenure;

            for ($i = 1; $i <= $tenure; $i++) {
                $balance -= $monthlyPrincipal;
                $schedule[] = [
                    'month' => $i,
                    'principal' => round($monthlyPrincipal, 2),
                    'interest' => round($monthlyInterest, 2),
                    'total' => round($monthlyPayment, 2),
                    'balance' => round(max(0, $balance), 2),
                ];
            }
        } else {
            // Reducing balance (simplified)
            $monthlyRate = ($rate / 100) / 12;
            $monthlyPayment = $amount * ($monthlyRate * pow(1 + $monthlyRate, $tenure)) / (pow(1 + $monthlyRate, $tenure) - 1);
            $totalPayment = $monthlyPayment * $tenure;
            $totalInterest = $totalPayment - $amount;

            for ($i = 1; $i <= $tenure; $i++) {
                $interest = $balance * $monthlyRate;
                $principal = $monthlyPayment - $interest;
                $balance -= $principal;
                
                $schedule[] = [
                    'month' => $i,
                    'principal' => round($principal, 2),
                    'interest' => round($interest, 2),
                    'total' => round($monthlyPayment, 2),
                    'balance' => round(max(0, $balance), 2),
                ];
            }
        }

        return response()->json([
            'application_id' => $id,
            'amount' => $amount,
            'tenure' => $tenure,
            'rate' => $rate,
            'type' => $type,
            'monthly_payment' => round($monthlyPayment, 2),
            'total_payment' => round($totalPayment, 2),
            'total_interest' => round($totalInterest, 2),
            'schedule' => $schedule
        ]);
    }

    public function approve(Request $request, $id)
    {
        DB::table('applications')
            ->where('id', $id)
            ->update([
                'status' => 'approved',
                'updated_at' => now()
            ]);

        // Add to audit trail
        DB::table('audit_trails')->insert([
            'user_id' => auth()->id() ?? 1,
            'action' => 'APPROVE_APPLICATION',
            'module' => 'module2',
            'auditable_type' => 'App\Models\Application',
            'auditable_id' => $id,
            'ip_address' => $request->ip(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'message' => 'Permohonan diluluskan berjaya',
            'status' => 'approved'
        ]);
    }

    public function reject(Request $request, $id)
    {
        $reason = $request->input('reason', 'Tidak memenuhi kriteria');
        
        DB::table('applications')
            ->where('id', $id)
            ->update([
                'status' => 'rejected',
                'rejection_reason' => $reason,
                'updated_at' => now()
            ]);

        // Add to audit trail
        DB::table('audit_trails')->insert([
            'user_id' => auth()->id() ?? 1,
            'action' => 'REJECT_APPLICATION',
            'module' => 'module2',
            'auditable_type' => 'App\Models\Application',
            'auditable_id' => $id,
            'ip_address' => $request->ip(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'message' => 'Permohonan ditolak',
            'status' => 'rejected',
            'rejection_letter_url' => '/storage/letters/reject_' . $id . '.pdf'
        ]);
    }

    public function kuari(Request $request, $id)
    {
        $fields = $request->input('fields', []);
        $notes = $request->input('notes', '');
        
        DB::table('applications')
            ->where('id', $id)
            ->update([
                'status' => 'kuari',
                'updated_at' => now()
            ]);

        // Add to audit trail
        DB::table('audit_trails')->insert([
            'user_id' => auth()->id() ?? 1,
            'action' => 'KUARI_APPLICATION',
            'module' => 'module2',
            'auditable_type' => 'App\Models\Application',
            'auditable_id' => $id,
            'ip_address' => $request->ip(),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        return response()->json([
            'message' => 'Permohonan dikembalikan untuk kuari',
            'status' => 'kuari',
            'flagged_fields' => $fields,
            'notes' => $notes
        ]);
    }

    public function offerLetter($id)
    {
        // In a real scenario, this would generate a PDF using DOMPDF
        // and upload it to MinIO. For POC, we return a mock URL.
        return response()->json([
            'message' => 'Surat tawaran berjaya dijana',
            'pdf_url' => '/storage/letters/offer_' . $id . '.pdf'
        ]);
    }

    private function getGradeLabel($grade)
    {
        return match ($grade) {
            'A' => 'Risiko Rendah',
            'B' => 'Risiko Sederhana Rendah',
            'C' => 'Risiko Sederhana Tinggi',
            'D' => 'Risiko Tinggi',
            default => 'Tidak Ditentukan',
        };
    }
}
