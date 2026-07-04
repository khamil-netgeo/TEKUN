<?php
namespace App\Modules\PenilaianKredit\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class CreditAssessmentController extends Controller
{
    public function index()
    {
        $apps = DB::table('applications')
            ->select('id', 'ref_no', 'applicant_name', 'amount_requested', 'status', 'created_at')
            ->whereIn('status', ['pending_assessment', 'under_review', 'approved', 'rejected'])
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json(['data' => $apps, 'total' => $apps->count()]);
    }

    public function show(string $id)
    {
        $app = DB::table('applications')->find($id);
        return response()->json(['data' => $app]);
    }

    public function dashboard(Request $request)
    {
        return response()->json([
            'total_applications'  => 1243,
            'pending_assessment'  => 87,
            'approved_today'      => 23,
            'rejected_today'      => 4,
            'avg_score'           => 72.4,
            'approval_rate'       => 68.5,
        ]);
    }

    public function score(Request $request)
    {
        return response()->json([
            'score'        => 74,
            'grade'        => 'B',
            'recommendation' => 'LULUS BERSYARAT',
            'factors'      => [
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
        return response()->json(['success' => true, 'message' => "Permohonan #{$id} diluluskan.", 'status' => 'approved']);
    }

    public function reject(Request $request, string $id)
    {
        return response()->json(['success' => true, 'message' => "Permohonan #{$id} ditolak.", 'status' => 'rejected']);
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
        $schedule    = [];
        $balance     = $principal;
        $payment     = ($months > 0 && $monthlyRate > 0)
            ? $principal * ($monthlyRate * pow(1 + $monthlyRate, $months)) / (pow(1 + $monthlyRate, $months) - 1)
            : ($months > 0 ? $principal / $months : 0);

        for ($i = 1; $i <= $months; $i++) {
            $interest       = $balance * $monthlyRate;
            $principalPart  = $payment - $interest;
            $balance       -= $principalPart;
            $schedule[]     = [
                'month'     => $i,
                'payment'   => round($payment, 2),
                'principal' => round($principalPart, 2),
                'interest'  => round($interest, 2),
                'balance'   => round(max(0, $balance), 2),
            ];
        }

        return response()->json([
            'principal'       => $principal,
            'rate'            => $rate,
            'months'          => $months,
            'monthly_payment' => round($payment, 2),
            'total_payment'   => round($payment * $months, 2),
            'total_interest'  => round($payment * $months - $principal, 2),
            'schedule'        => $schedule,
        ]);
    }

    public function offerLetter(string $id)
    {
        return response()->json(['id' => $id, 'status' => 'ready', 'pdf_url' => "/api/credit/offer-letter/{$id}/download"]);
    }

    public function sendOfferLetter(Request $request, string $id)
    {
        return response()->json(['success' => true, 'message' => "Surat tawaran #{$id} dihantar.", 'sent_at' => now()->toISOString()]);
    }

    public function approvalWorkflow(Request $request)
    {
        return response()->json([
            'stages' => [
                ['stage' => 'Semakan Pegawai',    'role' => 'branch_officer',  'sla_hours' => 24, 'status' => 'completed'],
                ['stage' => 'Penilaian Kredit',   'role' => 'credit_officer',  'sla_hours' => 48, 'status' => 'in_progress'],
                ['stage' => 'Kelulusan Pengurus',  'role' => 'branch_manager',  'sla_hours' => 24, 'status' => 'pending'],
            ],
        ]);
    }

    // Unused CRUD stubs
    public function create() {}
    public function store(Request $request) {}
    public function edit(string $id) {}
    public function update(Request $request, string $id) {}
    public function destroy(string $id) {}

    // POC alias: GET /api/applications/{id}/credit-score
    public function creditScoreForApp(Request $request, string $id)
    {
        $app = \DB::table('applications')->where('id', $id)->first();
        if (!$app) return response()->json(['error' => 'Not found'], 404);
        $score = rand(550, 850);
        return response()->json([
            'application_id' => $id,
            'score'          => $score,
            'grade'          => $score >= 750 ? 'A' : ($score >= 650 ? 'B' : 'C'),
            'recommendation' => $score >= 650 ? 'LULUS' : 'SEMAK SEMULA',
            'factors'        => [
                ['name' => 'Rekod CCRIS', 'score' => rand(60, 100), 'weight' => 30],
                ['name' => 'Pendapatan Bersih', 'score' => rand(50, 95), 'weight' => 25],
                ['name' => 'Nisbah Hutang', 'score' => rand(40, 90), 'weight' => 20],
                ['name' => 'Pengalaman Perniagaan', 'score' => rand(50, 100), 'weight' => 15],
                ['name' => 'Cagaran', 'score' => rand(30, 80), 'weight' => 10],
            ],
            'generated_at' => now()->toISOString(),
        ]);
    }

    // POC alias: GET /api/applications/{id}/amortization
    public function amortizationForApp(Request $request, string $id)
    {
        $amount  = (float) $request->query('amount', 50000);
        $tenure  = (int)   $request->query('tenure', 60);
        $rate    = (float) $request->query('rate', 4.0);
        $type    = $request->query('type', 'flat');
        $monthly = $type === 'flat'
            ? ($amount * $rate / 100 / 12) + ($amount / $tenure)
            : $amount * ($rate / 100 / 12) * pow(1 + $rate / 100 / 12, $tenure) / (pow(1 + $rate / 100 / 12, $tenure) - 1);
        $schedule = [];
        $balance  = $amount;
        for ($i = 1; $i <= min($tenure, 6); $i++) {
            $interest  = $type === 'flat' ? $amount * $rate / 100 / 12 : $balance * $rate / 100 / 12;
            $principal = $monthly - $interest;
            $balance   = max(0, $balance - $principal);
            $schedule[] = ['month' => $i, 'payment' => round($monthly, 2), 'principal' => round($principal, 2), 'interest' => round($interest, 2), 'balance' => round($balance, 2)];
        }
        return response()->json(['application_id' => $id, 'amount' => $amount, 'tenure' => $tenure, 'rate' => $rate, 'type' => $type, 'monthly_payment' => round($monthly, 2), 'total_payment' => round($monthly * $tenure, 2), 'total_interest' => round($monthly * $tenure - $amount, 2), 'schedule' => $schedule]);
    }

    // POC alias: POST /api/applications/{id}/approve
    public function approveApplication(Request $request, string $id)
    {
        $app = \DB::table('applications')->where('id', $id)->first();
        if (!$app) return response()->json(['error' => 'Not found'], 404);
        \DB::table('applications')->where('id', $id)->update(['status' => 'approved', 'updated_at' => now()]);
        return response()->json(['success' => true, 'application_id' => $id, 'status' => 'approved', 'approved_by' => auth()->user()->name ?? 'System', 'approved_at' => now()->toISOString(), 'comments' => $request->input('comments', '')]);
    }
}
