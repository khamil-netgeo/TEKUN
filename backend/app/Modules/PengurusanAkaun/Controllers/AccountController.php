<?php

namespace App\Modules\PengurusanAkaun\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => [
                ['id' => 'SPPT-ACC-2026-00089', 'name' => 'Siti Nurhaliza', 'scheme' => 'TEKUN Usahawan', 'status' => 'LANCAR', 'balance' => 23456.78, 'monthly' => 763.89, 'health' => 94],
                ['id' => 'SPPT-ACC-2026-00090', 'name' => 'Ahmad Razif', 'scheme' => 'TEKUN Micro', 'status' => 'LANCAR', 'balance' => 7234.12, 'monthly' => 312.45, 'health' => 88],
                ['id' => 'SPPT-ACC-2026-00091', 'name' => 'Noraini Hassan', 'scheme' => 'TEKUN Wanita', 'status' => 'TUNGGAKAN 1', 'balance' => 14567.89, 'monthly' => 567.23, 'health' => 62],
            ],
            'meta' => ['total' => 1247, 'lancar' => 1089, 'tunggakan' => 158, 'npl' => 45],
        ]);
    }

    public function create() {}

    public function store(Request $request)
    {
        return response()->json(['success' => true, 'message' => 'Akaun berjaya dicipta.'], 201);
    }

    public function show(string $id)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $id,
                'name' => 'Siti Nurhaliza',
                'scheme' => 'TEKUN Usahawan',
                'status' => 'LANCAR',
                'health' => 94,
                'balance' => 23456.78,
                'monthly_payment' => 763.89,
                'next_payment_date' => '01 Ogos 2026',
                'payments_made' => 3,
                'total_payments' => 36,
                'classification' => 'LANCAR - Tiada Tunggakan',
                'ai_forecast' => 'Akaun akan kekal LANCAR sepanjang tempoh',
            ],
        ]);
    }

    public function edit(string $id) {}

    public function update(Request $request, string $id)
    {
        return response()->json(['success' => true, 'message' => 'Akaun dikemaskini.']);
    }

    public function destroy(string $id)
    {
        return response()->json(['success' => true, 'message' => 'Akaun dipadam.']);
    }

    public function statement(Request $request, string $id)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'account_id' => $id,
                'period' => '2026-01 to 2026-07',
                'transactions' => [
                    ['date' => '2026-07-01', 'amount' => 763.89, 'channel' => 'FPX', 'receipt' => 'FPX260701234567'],
                    ['date' => '2026-06-01', 'amount' => 763.89, 'channel' => 'DuitNow', 'receipt' => 'DN260601234123'],
                    ['date' => '2026-05-01', 'amount' => 763.89, 'channel' => 'FPX', 'receipt' => 'FPX260501123789'],
                ],
            ],
        ]);
    }

    public function recordPayment(Request $request, string $id)
    {
        $amount = $request->input('amount', 0);
        $channel = $request->input('channel', 'FPX');
        return response()->json([
            'success' => true,
            'message' => "Bayaran RM {$amount} berjaya direkodkan.",
            'data' => [
                'account_id' => $id,
                'amount' => $amount,
                'channel' => $channel,
                'receipt' => strtoupper($channel) . now()->format('ymdHis'),
                'paid_at' => now()->toISOString(),
            ],
        ]);
    }

    public function calculateTawidh(Request $request, string $id)
    {
        $overdue = $request->input('overdue', 0);
        $days = $request->input('days', 0);
        $rate = 0.01; // 1% per annum BNM rate
        $tawidh = $overdue * $rate * ($days / 365);
        return response()->json([
            'success' => true,
            'data' => [
                'account_id' => $id,
                'overdue_amount' => $overdue,
                'days_overdue' => $days,
                'rate' => $rate,
                'tawidh' => round($tawidh, 2),
                'total_payable' => round($overdue + $tawidh, 2),
                'formula' => "RM {$overdue} × {$rate} × ({$days}/365) = RM " . round($tawidh, 2),
                'shariah_compliant' => true,
            ],
        ]);
    }

    public function tawidhInfo(Request $request)
    {
        $overdue = $request->input('overdue', 0);
        $days = $request->input('days', 0);
        $rate = 0.01;
        $tawidh = $overdue > 0 ? $overdue * $rate * ($days / 365) : 0;
        return response()->json([
            'success' => true,
            'data' => [
                'rate' => $rate,
                'rate_label' => 'Kadar BNM Semasa: 1% setahun',
                'formula' => "Ta'widh = Jumlah Tertunggak x Kadar x (Hari / 365)",
                'shariah_compliant' => true,
                'authority' => 'BNM Guidelines on Late Payment Charges for Islamic Finance',
                'tawidh' => round($tawidh, 2),
            ],
        ]);
    }

    public function moratorium(Request $request, string $id)
    {
        $type = $request->input('type', 'moratorium');
        $months = $request->input('months', 3);
        $reason = $request->input('reason', '');
        return response()->json([
            'success' => true,
            'message' => "Permohonan {$type} selama {$months} bulan telah dihantar.",
            'data' => [
                'account_id' => $id,
                'type' => $type,
                'months' => $months,
                'reason' => $reason,
                'status' => 'DALAM_SEMAKAN',
                'expected_approval' => now()->addDays(3)->toDateString(),
                'submitted_at' => now()->toISOString(),
            ],
        ]);
    }

    public function applyMoratorium(Request $request, string $id)
    {
        return $this->moratorium($request, $id);
    }

    public function payments(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => [
                ['id' => 1, 'account_id' => 'SPPT-ACC-2026-00089', 'borrower' => 'Siti Nurhaliza', 'amount' => 763.89, 'channel' => 'FPX', 'receipt' => 'FPX260701234567', 'status' => 'BERJAYA', 'paid_at' => now()->subDays(3)->toDateString()],
                ['id' => 2, 'account_id' => 'SPPT-ACC-2026-00090', 'borrower' => 'Ahmad Razif', 'amount' => 312.45, 'channel' => 'DuitNow', 'receipt' => 'DN260601234123', 'status' => 'BERJAYA', 'paid_at' => now()->subDays(5)->toDateString()],
                ['id' => 3, 'account_id' => 'SPPT-ACC-2026-00091', 'borrower' => 'Noraini Hassan', 'amount' => 567.23, 'channel' => 'Kaunter', 'receipt' => null, 'status' => 'MENUNGGU', 'paid_at' => null],
            ],
            'meta' => ['total' => 3, 'page' => 1, 'per_page' => 20],
        ]);
    }
}
