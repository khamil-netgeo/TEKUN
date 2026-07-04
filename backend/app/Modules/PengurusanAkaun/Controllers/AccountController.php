<?php

namespace App\Modules\PengurusanAkaun\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\PengurusanAkaun\Services\TawidhService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

/**
 * Module 4 — Pengurusan Akaun & Pembayaran Balik
 *
 * Handles all account management and repayment operations.
 * Implements Account 360, multi-channel payment, Ta'widh, and moratorium.
 */
class AccountController extends Controller
{
    public function __construct(
        private TawidhService $tawidhService
    ) {}

    private function mockAccounts(): array
    {
        return [
            [
                'id' => 'SPPT-ACC-2026-00089', 'account_no' => 'TEKUN-2026-00089',
                'borrower_name' => 'Siti Nurhaliza binti Ahmad', 'ic_no' => '880101-14-5678',
                'scheme' => 'TEKUN Usahawan', 'status' => 'LANCAR', 'health' => 94,
                'outstanding_balance' => 23456.78, 'original_amount' => 30000.00,
                'monthly_instalment' => 763.89, 'profit_rate' => 8.0,
                'start_date' => '2026-03-01', 'maturity_date' => '2033-03-01',
                'tenure_months' => 84, 'payments_made' => 3,
                'arrears_days' => 0, 'arrears_amount' => 0.00,
                'classification' => 'lancar', 'tawidh_amount' => 0.00,
                'moratorium_active' => false, 'moratorium_end_date' => null,
                'branch' => 'Cawangan Kuala Lumpur Pusat',
                'officer' => 'Ahmad Fadzillah bin Ismail',
                'next_payment_date' => '2026-08-01',
            ],
            [
                'id' => 'SPPT-ACC-2026-00090', 'account_no' => 'TEKUN-2026-00090',
                'borrower_name' => 'Ahmad Razif bin Othman', 'ic_no' => '790505-10-1234',
                'scheme' => 'TEKUN Micro', 'status' => 'LANCAR', 'health' => 88,
                'outstanding_balance' => 7234.12, 'original_amount' => 10000.00,
                'monthly_instalment' => 312.45, 'profit_rate' => 6.5,
                'start_date' => '2025-10-01', 'maturity_date' => '2029-10-01',
                'tenure_months' => 48, 'payments_made' => 9,
                'arrears_days' => 0, 'arrears_amount' => 0.00,
                'classification' => 'lancar', 'tawidh_amount' => 0.00,
                'moratorium_active' => false, 'moratorium_end_date' => null,
                'branch' => 'Cawangan Petaling Jaya',
                'officer' => 'Nurul Ain binti Rashid',
                'next_payment_date' => '2026-08-01',
            ],
            [
                'id' => 'SPPT-ACC-2026-00091', 'account_no' => 'TEKUN-2026-00091',
                'borrower_name' => 'Noraini binti Hassan', 'ic_no' => '850312-06-7890',
                'scheme' => 'TEKUN Wanita', 'status' => 'TUNGGAKAN 1', 'health' => 62,
                'outstanding_balance' => 14567.89, 'original_amount' => 20000.00,
                'monthly_instalment' => 567.23, 'profit_rate' => 7.0,
                'start_date' => '2024-07-01', 'maturity_date' => '2030-07-01',
                'tenure_months' => 72, 'payments_made' => 18,
                'arrears_days' => 32, 'arrears_amount' => 567.23,
                'classification' => 'perhatian_khusus', 'tawidh_amount' => 1.62,
                'moratorium_active' => false, 'moratorium_end_date' => null,
                'branch' => 'Cawangan Shah Alam',
                'officer' => 'Mohd Faizal bin Aziz',
                'next_payment_date' => '2026-07-01',
            ],
        ];
    }

    private function findAccount(string $id): ?array
    {
        foreach ($this->mockAccounts() as $account) {
            if ($account['id'] === $id || $account['account_no'] === $id) {
                return $account;
            }
        }
        return null;
    }

    private function generateSchedule(float $balance, float $rate, float $payment, int $months): array
    {
        $schedule = [];
        $monthlyRate = $rate / 100 / 12;
        $currentBalance = $balance;
        for ($i = 1; $i <= $months; $i++) {
            $interest  = round($currentBalance * $monthlyRate, 2);
            $principal = round($payment - $interest, 2);
            $currentBalance = max(0, round($currentBalance - $principal, 2));
            $schedule[] = [
                'bulan' => $i, 'tarikh' => now()->addMonths($i)->format('Y-m-d'),
                'ansuran' => $payment, 'prinsipal' => $principal,
                'keuntungan' => $interest, 'baki' => $currentBalance,
            ];
            if ($currentBalance <= 0) break;
        }
        return $schedule;
    }

    private function analyzeHardship(string $reason): array
    {
        $reason = strtolower($reason);
        $score  = 30;
        $factors = [];
        $keywords = [
            'kehilangan pekerjaan' => 25, 'sakit' => 20, 'banjir' => 20,
            'kemalangan' => 20, 'covid' => 15, 'perniagaan rugi' => 20,
            'kematian' => 25, 'bankrap' => 30,
        ];
        foreach ($keywords as $keyword => $weight) {
            if (str_contains($reason, $keyword)) {
                $score += $weight;
                $factors[] = ucfirst($keyword) . " dikesan dalam alasan";
            }
        }
        $score = min(100, $score);
        $level = $score >= 70 ? 'TINGGI' : ($score >= 40 ? 'SEDERHANA' : 'RENDAH');
        return [
            'score' => $score, 'level' => $level, 'factors' => $factors,
            'recommendation' => $score >= 70
                ? 'Kes kesusahan tinggi — disyorkan kelulusan segera.'
                : ($score >= 40 ? 'Kes sederhana — semak dokumen sokongan.' : 'Kes biasa — ikut prosedur standard.'),
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $accounts = $this->mockAccounts();
        if ($search = $request->query('search')) {
            $accounts = array_filter($accounts, fn ($a) =>
                str_contains(strtolower($a['borrower_name']), strtolower($search)) ||
                str_contains($a['account_no'], $search)
            );
        }
        return response()->json([
            'success' => true,
            'data'    => array_values($accounts),
            'meta'    => ['total' => 1247, 'lancar' => 1089, 'tunggakan' => 113, 'npl' => 45, 'page' => 1, 'per_page' => 20],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $account = $this->findAccount($id);
        if (!$account) {
            return response()->json(['success' => false, 'message' => 'Akaun tidak dijumpai.'], 404);
        }
        $account['progress_percent'] = round(($account['payments_made'] / $account['tenure_months']) * 100);
        $account['upcoming_schedule'] = $this->generateSchedule($account['outstanding_balance'], $account['profit_rate'], $account['monthly_instalment'], 6);
        return response()->json(['success' => true, 'data' => $account]);
    }

    public function paymentHistory(Request $request, string $id): JsonResponse
    {
        $account = $this->findAccount($id);
        if (!$account) {
            return response()->json(['success' => false, 'message' => 'Akaun tidak dijumpai.'], 404);
        }
        $history = [
            ['id' => 3, 'tarikh' => '2026-07-01', 'amaun' => 763.89, 'saluran' => 'FPX',     'resit' => 'FPX260701234567', 'status' => 'BERJAYA', 'principal' => 539.29, 'keuntungan' => 224.60],
            ['id' => 2, 'tarikh' => '2026-06-01', 'amaun' => 763.89, 'saluran' => 'DuitNow', 'resit' => 'DN260601234123',  'status' => 'BERJAYA', 'principal' => 537.81, 'keuntungan' => 226.08],
            ['id' => 1, 'tarikh' => '2026-05-01', 'amaun' => 763.89, 'saluran' => 'FPX',     'resit' => 'FPX260501123789', 'status' => 'BERJAYA', 'principal' => 536.33, 'keuntungan' => 227.56],
        ];
        return response()->json([
            'success' => true, 'data' => $history,
            'meta' => ['account_id' => $id, 'total' => count($history), 'page' => 1, 'per_page' => 20, 'total_paid' => array_sum(array_column($history, 'amaun'))],
        ]);
    }

    public function recordPayment(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'amount'  => 'required|numeric|min:1',
            'channel' => 'required|string',
        ]);
        $account = $this->findAccount($id);
        if (!$account) {
            return response()->json(['success' => false, 'message' => 'Akaun tidak dijumpai.'], 404);
        }
        $channel = strtoupper($validated['channel']);
        $receiptNo = $channel . now()->format('ymdHis') . rand(100, 999);
        $amount = (float) $validated['amount'];
        $monthlyRate = $account['profit_rate'] / 100 / 12;
        $profitPortion = round($account['outstanding_balance'] * $monthlyRate, 2);
        $principalPortion = round($amount - $profitPortion, 2);
        return response()->json([
            'success' => true,
            'message' => "Bayaran RM {$amount} berjaya direkodkan melalui {$channel}.",
            'data' => [
                'account_id' => $id, 'account_no' => $account['account_no'],
                'borrower_name' => $account['borrower_name'],
                'amount' => $amount, 'principal_portion' => max(0, $principalPortion),
                'profit_portion' => $profitPortion, 'tawidh_portion' => 0.00,
                'channel' => $channel, 'receipt_no' => $receiptNo,
                'status' => 'success', 'paid_at' => now()->toISOString(),
                'new_balance' => round($account['outstanding_balance'] - max(0, $principalPortion), 2),
            ],
        ]);
    }

    public function tawidh(string $id): JsonResponse
    {
        $account = $this->findAccount($id);
        if (!$account) {
            return response()->json(['success' => false, 'message' => 'Akaun tidak dijumpai.'], 404);
        }
        $result = $this->tawidhService->calculateManual((float)$account['arrears_amount'], (int)$account['arrears_days'], $account['account_no']);
        return response()->json([
            'success' => true,
            'data' => array_merge($result, ['account_id' => $id, 'account_no' => $account['account_no'], 'borrower_name' => $account['borrower_name']]),
        ]);
    }

    public function moratorium(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'type'   => 'required|string',
            'months' => 'required|integer|min:1|max:24',
            'reason' => 'required|string|min:20',
        ]);
        $account = $this->findAccount($id);
        if (!$account) {
            return response()->json(['success' => false, 'message' => 'Akaun tidak dijumpai.'], 404);
        }
        $newSchedule = $this->generateSchedule($account['outstanding_balance'], $account['profit_rate'], $account['monthly_instalment'], $validated['months'] + 6);
        $hardshipScore = $this->analyzeHardship($validated['reason']);
        return response()->json([
            'success' => true,
            'message' => "Permohonan {$validated['type']} selama {$validated['months']} bulan telah dihantar untuk kelulusan.",
            'data' => [
                'account_id' => $id, 'account_no' => $account['account_no'],
                'borrower_name' => $account['borrower_name'],
                'type' => $validated['type'], 'months' => $validated['months'],
                'reason' => $validated['reason'], 'status' => 'DALAM_SEMAKAN',
                'reference_no' => 'MOR-' . now()->format('Ymd') . '-' . strtoupper(Str::random(6)),
                'submitted_at' => now()->toISOString(),
                'expected_approval' => now()->addDays(3)->toDateString(),
                'ai_hardship_score' => $hardshipScore,
                'new_schedule' => $newSchedule,
            ],
        ]);
    }

    /**
     * Alias for moratorium() — called by routes/api.php as applyMoratorium.
     * Added by Module 4 Agent to match route definition in routes/api.php.
     */
    public function applyMoratorium(Request $request, string $id): JsonResponse
    {
        return $this->moratorium($request, $id);
    }

    public function statement(string $id): JsonResponse
    {
        $account = $this->findAccount($id);
        if (!$account) {
            return response()->json(['success' => false, 'message' => 'Akaun tidak dijumpai.'], 404);
        }
        return response()->json([
            'success' => true,
            'data' => [
                'account_id' => $id, 'account_no' => $account['account_no'],
                'borrower_name' => $account['borrower_name'],
                'period' => '2026-01 hingga 2026-07', 'generated_at' => now()->toISOString(),
                'transactions' => [
                    ['tarikh' => '2026-07-01', 'amaun' => 763.89, 'saluran' => 'FPX',     'resit' => 'FPX260701234567', 'status' => 'BERJAYA'],
                    ['tarikh' => '2026-06-01', 'amaun' => 763.89, 'saluran' => 'DuitNow', 'resit' => 'DN260601234123',  'status' => 'BERJAYA'],
                    ['tarikh' => '2026-05-01', 'amaun' => 763.89, 'saluran' => 'FPX',     'resit' => 'FPX260501123789', 'status' => 'BERJAYA'],
                ],
            ],
        ]);
    }
}
