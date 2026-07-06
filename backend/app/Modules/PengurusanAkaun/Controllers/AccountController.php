<?php

namespace App\Modules\PengurusanAkaun\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Payment;
use App\Modules\PengurusanAkaun\Models\Moratorium;
use App\Modules\PengurusanAkaun\Services\AiDefaultPredictionService;
use App\Modules\PengurusanAkaun\Services\TawidhService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Module 4 — Pengurusan Akaun & Pembayaran Balik
 *
 * All methods use real Eloquent queries against the PostgreSQL database.
 * No mock data — every response reflects live DB state.
 * Supports lookup by numeric ID or account_no string.
 */
class AccountController extends Controller
{
    public function __construct(
        private TawidhService $tawidhService,
        private AiDefaultPredictionService $aiPredictionService
    ) {}

    // ─── Private Helpers ────────────────────────────────────────────────────

    /**
     * Resolve an account by numeric primary key or account_no string.
     * Throws ModelNotFoundException (404) if not found.
     */
    private function resolveAccount(string $id, array $with = []): Account
    {
        $query = Account::with($with);
        if (is_numeric($id)) {
            return $query->findOrFail((int) $id);
        }
        return $query->where('account_no', $id)->firstOrFail();
    }

    // ─── Public API Methods ──────────────────────────────────────────────────

    /**
     * GET /api/accounts
     * Paginated account list, filtered by branch for non-admin users.
     */
    public function index(Request $request): JsonResponse
    {
        $user  = Auth::user();
        $query = Account::with(['payments' => fn ($q) => $q->orderByDesc('paid_at')->limit(3)]);

        if ($user && $user->branch_id && !$user->hasRole('Pentadbir Sistem')) {
            $query->where('branch_id', $user->branch_id);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn ($q) => $q
                ->where('account_no', 'ilike', "%{$s}%")
                ->orWhere('borrower_name', 'ilike', "%{$s}%")
                ->orWhere('ic_no', 'ilike', "%{$s}%")
            );
        }

        if ($request->filled('status')) {
            $query->where('classification', $request->status);
        }

        $accounts = $query->orderByDesc('created_at')->paginate(15);

        return response()->json([
            'success' => true,
            'data'    => $accounts->items(),
            'meta'    => [
                'total'        => $accounts->total(),
                'per_page'     => $accounts->perPage(),
                'current_page' => $accounts->currentPage(),
                'last_page'    => $accounts->lastPage(),
            ],
        ]);
    }

    /**
     * GET /api/accounts/{id}
     * Account 360 — full details with upcoming schedule and moratoriums.
     */
    public function show(string $id): JsonResponse
    {
        $account = $this->resolveAccount($id, [
            'payments'    => fn ($q) => $q->orderByDesc('paid_at')->limit(10),
            'moratoriums' => fn ($q) => $q->orderByDesc('created_at')->limit(5),
        ]);

        $data = $account->toArray();
        $data['upcoming_schedule'] = $this->buildPaymentSchedule($account);

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * GET /api/accounts/{id}/payment-history
     * Full payment history for an account.
     */
    public function paymentHistory(string $id): JsonResponse
    {
        $account  = $this->resolveAccount($id);
        $payments = Payment::where('account_id', $account->id)
            ->orderByDesc('paid_at')
            ->get()
            ->map(fn ($p) => [
                'id'         => $p->id,
                'receipt_no' => $p->receipt_no,
                'amount'     => $p->amount,
                'channel'    => $p->channel,
                'paid_at'    => $p->paid_at,
                'status'     => $p->status ?? 'completed',
                'notes'      => $p->notes,
            ]);

        return response()->json(['success' => true, 'data' => $payments]);
    }

    /**
     * POST /api/accounts/{id}/payment
     * Record a payment and return a receipt.
     */
    public function recordPayment(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'amount'  => 'required|numeric|min:0.01',
            'channel' => 'required|string|in:fpx,jompay,duitnow,kaunter,auto_debit',
        ]);

        $account = $this->resolveAccount($id);

        DB::beginTransaction();
        try {
            $receiptNo = 'RCP-' . strtoupper($request->channel) . '-' . now()->format('YmdHis') . '-' . rand(1000, 9999);

            $payment = Payment::create([
                'account_id'   => $account->id,
                'receipt_no'   => $receiptNo,
                'amount'       => $request->amount,
                'channel'      => $request->channel,
                'paid_at'      => now(),
                'status'       => 'completed',
                'processed_by' => Auth::id(),
                'notes'        => $request->get('notes'),
            ]);

            $account->outstanding_balance = max(0, $account->outstanding_balance - $request->amount);
            $account->total_paid          = ($account->total_paid ?? 0) + $request->amount;
            $account->save();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Pembayaran berjaya direkodkan.',
                'data'    => [
                    'receipt_no'  => $payment->receipt_no,
                    'amount'      => $payment->amount,
                    'channel'     => $payment->channel,
                    'paid_at'     => $payment->paid_at,
                    'new_balance' => $account->outstanding_balance,
                ],
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('recordPayment error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Ralat merekod pembayaran: ' . $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/accounts/{id}/tawidh
     * Calculate Ta'widh (Shariah-compliant penalty) based on live DB data.
     */
    public function tawidh(string $id): JsonResponse
    {
        $account = $this->resolveAccount($id);

        $daysOverdue        = (int)   ($account->arrears_days        ?? 0);
        $outstandingBalance = (float) ($account->outstanding_balance ?? 0);

        $result = $this->tawidhService->calculateManual(
            $outstandingBalance,
            $daysOverdue,
            $account->account_no
        );

        return response()->json([
            'success' => true,
            'data'    => array_merge($result, [
                'amount'              => $result['tawidh'],
                'days_overdue'        => $daysOverdue,
                'outstanding_balance' => $outstandingBalance,
            ]),
        ]);
    }

    /**
     * POST /api/accounts/{id}/moratorium
     * Submit a moratorium/restructuring request with AI hardship analysis.
     */
    public function moratorium(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'months_requested' => 'required|integer|min:1|max:24',
            'reason'           => 'required|string|max:500',
            'notes'            => 'nullable|string|max:1000',
        ]);

        $account = $this->resolveAccount($id);

        $monthsRequested    = (int) $request->months_requested;
        $remainingMonths    = (int) ($account->remaining_months ?? 12);
        $newRemainingMonths = $remainingMonths + $monthsRequested;
        $newInstalment      = $newRemainingMonths > 0
            ? round($account->outstanding_balance / $newRemainingMonths, 2)
            : (float) ($account->monthly_instalment ?? 0);
        $newEndDate = now()->addMonths($newRemainingMonths)->toDateString();

        $moratorium = Moratorium::create([
            'account_id'       => $account->id,
            'months_requested' => $monthsRequested,
            'reason'           => $request->reason,
            'notes'            => $request->get('notes'),
            'new_instalment'   => $newInstalment,
            'new_end_date'     => $newEndDate,
            'status'           => 'pending',
            'submitted_by'     => Auth::id(),
        ]);

        $aiAnalysis = null;
        try {
            $aiAnalysis = $this->analyzeHardship($account, $request->reason, $monthsRequested);
        } catch (\Throwable $e) {
            Log::warning('AI hardship analysis failed: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Permohonan moratorium telah dihantar untuk kelulusan.',
            'data'    => [
                'moratorium_id'    => $moratorium->id,
                'status'           => $moratorium->status,
                'months_requested' => $moratorium->months_requested,
                'new_instalment'   => $moratorium->new_instalment,
                'new_end_date'     => $moratorium->new_end_date,
                'new_schedule'     => [
                    'new_monthly_instalment' => $newInstalment,
                    'new_maturity_date'      => $newEndDate,
                    'months_extended'        => $monthsRequested,
                ],
                'ai_analysis'      => $aiAnalysis,
            ],
        ]);
    }

    /**
     * Alias for moratorium() — used by main routes/api.php.
     */
    public function applyMoratorium(Request $request, string $id): JsonResponse
    {
        return $this->moratorium($request, $id);
    }

    // ─── Private Helpers ────────────────────────────────────────────────────

    private function buildPaymentSchedule(Account $account): array
    {
        $schedule    = [];
        $instalment  = (float) ($account->monthly_instalment ?? 0);
        $balance     = (float) ($account->outstanding_balance ?? 0);
        $annualRate  = (float) ($account->profit_rate ?? 0.07);
        $monthlyRate = $annualRate / 12 / 100; // profit_rate stored as percentage

        for ($i = 1; $i <= 6; $i++) {
            $interest  = round($balance * $monthlyRate, 2);
            $principal = round($instalment - $interest, 2);
            $balance   = max(0, round($balance - $principal, 2));
            $dueDate   = now()->addMonths($i)->startOfMonth();

            $schedule[] = [
                'month'      => $dueDate->format('F Y'),
                'due_date'   => $dueDate->toDateString(),
                'instalment' => $instalment,
                'principal'  => $principal,
                'interest'   => $interest,
                'balance'    => $balance,
                'status'     => 'AKAN DATANG',
            ];
        }

        return $schedule;
    }

    private function analyzeHardship(Account $account, string $reason, int $months): array
    {
        return $this->aiPredictionService->analyzeHardship($account, $reason, $months);
    }
}