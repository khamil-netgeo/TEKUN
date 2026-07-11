<?php

namespace App\Modules\UsahawanPortal\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\PengurusanAkaun\Models\Account;
use App\Modules\PengurusanAkaun\Models\Moratorium;
use App\Modules\PengurusanAkaun\Models\Payment;
use App\Modules\PermohonanPembiayaan\Models\Application;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Throwable;

class UsahawanController extends Controller
{
    // ─── 1. GET /api/usahawan/dashboard ─────────────────────────────────────

    public function dashboard(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();
        if (!$user || $user->role !== 'usahawan') {
            return response()->json(['success' => false, 'message' => 'Akses ditolak. Hanya usahawan dibenarkan.'], 403);
        }

        $account          = $this->getUsahawanAccount($user->id);
        $activeApplication = Application::where('applicant_id', $user->id)
            ->whereNotIn('status', ['approved', 'rejected', 'disbursed'])
            ->latest('submitted_at')
            ->first();

        $recentActivities = $this->getRecentActivities($user->id, $account?->id);
        $aiData           = $this->getAiInsights($account);

        return response()->json([
            'success' => true,
            'data'    => [
                'name'                      => $user->name,
                'outstanding_balance'       => $account ? (float) $account->outstanding_balance : 0.0,
                'next_installment_amount'   => $account ? (float) $account->monthly_instalment : 0.0,
                'next_installment_date'     => $account ? $this->calculateNextInstallmentDate($account) : null,
                'total_applications'        => Application::where('applicant_id', $user->id)->count(),
                'active_application_status' => $activeApplication
                    ? $this->getStatusLabel($activeApplication->status)
                    : null,
                'credit_score'              => $aiData['credit_score'],
                'ai_recommendation'         => $aiData['ai_recommendation'],
                'recent_activities'         => $recentActivities,
            ],
        ]);
    }

    // ─── 2. GET /api/usahawan/my-applications ───────────────────────────────

    public function myApplications(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();
        if (!$user || $user->role !== 'usahawan') {
            return response()->json(['success' => false, 'message' => 'Akses ditolak. Hanya usahawan dibenarkan.'], 403);
        }

        $query = Application::query()
            ->where('applicant_id', $user->id)
            ->select('id', 'ref_no', 'scheme', 'amount_requested', 'status',
                     'submitted_at', 'updated_at', 'remarks')
            ->orderBy('submitted_at', 'desc');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('ref_no', 'ILIKE', "%{$search}%")
                  ->orWhere('scheme', 'ILIKE', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $applications = $query->paginate(15);

        $applications->getCollection()->transform(fn($app) => [
            'id'               => $app->id,
            'reference_no'     => $app->ref_no,
            'scheme_type'      => $app->scheme,
            'amount_requested' => (float) $app->amount_requested,
            'status'           => $app->status,
            'status_label'     => $this->getStatusLabel($app->status),
            'submitted_at'     => $app->submitted_at?->toIso8601String(),
            'updated_at'       => $app->updated_at?->toIso8601String(),
            'remarks'          => $app->remarks,
        ]);

        return response()->json(['success' => true, 'data' => $applications]);
    }

    // ─── 3. GET /api/accounts/my ────────────────────────────────────────────

    public function myAccount(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();
        if (!$user || $user->role !== 'usahawan') {
            return response()->json(['success' => false, 'message' => 'Akses ditolak. Hanya usahawan dibenarkan.'], 403);
        }

        $account = $this->getUsahawanAccount($user->id, ['payments', 'application']);
        if (!$account) {
            return response()->json([
                'success' => false,
                'message' => 'Tiada akaun pembiayaan aktif dijumpai.',
            ], 404);
        }

        $maturityDate    = Carbon::parse($account->maturity_date);
        $remainingMonths = max(0, (int) now()->diffInMonths($maturityDate, false));

        return response()->json([
            'success' => true,
            'data'    => [
                'account_no'           => $account->account_no,
                'scheme_type'          => $account->application?->scheme ?? '—',
                'financing_amount'     => (float) $account->principal,
                'outstanding_balance'  => (float) $account->outstanding_balance,
                'monthly_installment'  => (float) $account->monthly_instalment,
                'profit_rate'          => (float) $account->profit_rate,
                'tenure_months'        => $account->tenure_months,
                'remaining_months'     => $remainingMonths,
                'start_date'           => Carbon::parse($account->start_date)->format('Y-m-d'),
                'maturity_date'        => $maturityDate->format('Y-m-d'),
                'status'               => $account->status,
                'classification'       => $account->classification,
                'repayment_progress'   => $account->principal > 0
                    ? round(($account->total_paid / $account->principal) * 100, 1)
                    : 0,
                'payment_history'      => $account->payments->map(fn($p) => [
                    'id'           => $p->id,
                    'payment_date' => Carbon::parse($p->payment_date)->format('Y-m-d'),
                    'amount'       => (float) $p->amount,
                    'type'         => $p->type,
                    'reference'    => $p->transaction_ref,
                    'status'       => $p->status,
                ]),
                'upcoming_schedule'    => $this->generateAmortisationSchedule($account),
            ],
        ]);
    }

    // ─── 4. POST /api/accounts/my/payment ───────────────────────────────────

    public function storePayment(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();
        if (!$user || $user->role !== 'usahawan') {
            return response()->json(['success' => false, 'message' => 'Akses ditolak. Hanya usahawan dibenarkan.'], 403);
        }

        $validated = $request->validate([
            'amount'       => 'required|numeric|min:1',
            'channel'      => ['required', 'string', Rule::in(['fpx', 'online_banking', 'counter', 'auto_debit'])],
            'payment_type' => ['required', 'string', Rule::in(['installment', 'advance', 'settlement', 'tawidh'])],
        ]);

        $account = $this->getUsahawanAccount($user->id);
        if (!$account) {
            return response()->json(['success' => false, 'message' => 'Akaun pembiayaan tidak dijumpai.'], 404);
        }
        if ($account->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'Pembayaran hanya boleh dibuat untuk akaun aktif.'], 422);
        }

        $paymentRef = 'PAY-' . date('Y') . '-' . strtoupper(Str::random(5));

        DB::beginTransaction();
        try {
            $payment = Payment::create([
                'account_id'        => $account->id,
                'amount'            => $validated['amount'],
                'type'              => $validated['payment_type'],
                'channel'           => $validated['channel'],
                'status'            => 'success',
                'transaction_ref'   => $paymentRef,
                'payment_date'      => now()->toDateString(),
                'principal_portion' => round($validated['amount'] * 0.8, 2),
                'profit_portion'    => round($validated['amount'] * 0.2, 2),
                'tawidh_portion'    => 0,
            ]);

            $account->outstanding_balance = max(0, $account->outstanding_balance - $validated['amount']);
            $account->total_paid          = ($account->total_paid ?? 0) + $validated['amount'];
            if (isset($account->arrears_amount) && $account->arrears_amount > 0) {
                $account->arrears_amount = max(0, $account->arrears_amount - $validated['amount']);
                if ($account->arrears_amount == 0) {
                    $account->arrears_days = 0;
                }
            }
            $account->save();
            DB::commit();

            return response()->json([
                'success'   => true,
                'message'   => 'Bayaran berjaya direkodkan.',
                'reference' => $paymentRef,
                'data'      => [
                    'amount'                   => (float) $payment->amount,
                    'channel'                  => $payment->channel,
                    'payment_date'             => Carbon::parse($payment->payment_date)->format('Y-m-d'),
                    'new_outstanding_balance'  => (float) $account->outstanding_balance,
                ],
            ], 201);

        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('UsahawanPortal payment failed: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal merekod bayaran. Sila cuba lagi.'], 500);
        }
    }

    // ─── 5. POST /api/accounts/my/moratorium ────────────────────────────────

    public function storeMoratorium(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = Auth::user();
        if (!$user || $user->role !== 'usahawan') {
            return response()->json(['success' => false, 'message' => 'Akses ditolak. Hanya usahawan dibenarkan.'], 403);
        }

        $validated = $request->validate([
            'moratorium_type' => ['required', 'string', Rule::in(['full_deferment', 'partial_deferment', 'restructure'])],
            'duration_months' => ['required', 'integer', Rule::in([1, 2, 3, 6])],
            'reason'          => 'required|string|max:1000',
            'reason_detail'   => 'nullable|string|max:2000',
            'documents'       => 'sometimes|array|max:5',
            'documents.*'     => 'file|mimes:pdf,jpg,jpeg,png|max:2048',
        ]);

        $account = $this->getUsahawanAccount($user->id);
        if (!$account) {
            return response()->json(['success' => false, 'message' => 'Akaun pembiayaan tidak dijumpai.'], 404);
        }

        if (Moratorium::where('account_id', $account->id)->where('status', 'pending')->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah mempunyai permohonan moratorium yang sedang diproses.',
            ], 422);
        }

        DB::beginTransaction();
        try {
            $aiPrompt = "Evaluate moratorium request for TEKUN Account {$account->account_no}. "
                . "Outstanding: RM{$account->outstanding_balance}. "
                . "Arrears: {$account->arrears_days} days. Classification: {$account->classification}. "
                . "Reason: {$validated['reason']}. "
                . "Reply with only: DISYORKAN or TIDAK DISYORKAN";
            $aiRecommendation = $this->getAiTextResponse($aiPrompt, 'TIDAK DISYORKAN');

            $moratorium = Moratorium::create([
                'account_id'        => $account->id,
                'type'              => 'moratorium',
                'moratorium_type'   => $validated['moratorium_type'],
                'months_requested'  => $validated['duration_months'],
                'reason'            => $validated['reason'],
                'status'            => 'pending',
                'ai_recommendation' => $aiRecommendation,
                'submitted_by'      => $user->id,
                'submitted_at'      => now(),
            ]);

            // Handle document uploads to MinIO/private disk
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $file) {
                    $file->store("moratoriums/{$moratorium->id}", 'private');
                }
            }

            DB::commit();

            return response()->json([
                'success'   => true,
                'message'   => 'Permohonan moratorium telah dihantar untuk kelulusan.',
                'reference' => 'MOR-' . date('Y') . '-' . str_pad($moratorium->id, 6, '0', STR_PAD_LEFT),
                'data'      => [
                    'moratorium_id'            => $moratorium->id,
                    'status'                   => 'pending',
                    'moratorium_type'          => $moratorium->moratorium_type,
                    'duration_months'          => $moratorium->months_requested,
                    'estimated_new_instalment' => 0.00,
                    'ai_recommendation'        => $moratorium->ai_recommendation,
                ],
            ], 201);

        } catch (Throwable $e) {
            DB::rollBack();
            Log::error('UsahawanPortal moratorium failed: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gagal menghantar permohonan moratorium. Sila cuba lagi.'], 500);
        }
    }

    // ─── Private Helpers ────────────────────────────────────────────────────

    private function getUsahawanAccount(int $userId, array $with = []): ?Account
    {
        $query = Account::whereHas('application', fn($q) => $q->where('applicant_id', $userId));
        if (!empty($with)) {
            $query->with($with);
        }
        return $query->where('status', 'active')->first()
            ?? $query->first();
    }

    private function getRecentActivities(int $userId, ?int $accountId, int $limit = 5): array
    {
        $activities = [];

        // Recent applications
        $apps = Application::where('applicant_id', $userId)
            ->orderBy('updated_at', 'desc')
            ->limit(3)
            ->get();
        foreach ($apps as $app) {
            $activities[] = [
                'type'        => 'application',
                'description' => "Permohonan {$app->ref_no} — " . $this->getStatusLabel($app->status),
                'date'        => $app->updated_at?->toIso8601String(),
                'icon'        => 'file-text',
            ];
        }

        // Recent payments
        if ($accountId) {
            $payments = Payment::where('account_id', $accountId)
                ->orderBy('payment_date', 'desc')
                ->limit(3)
                ->get();
            foreach ($payments as $payment) {
                $activities[] = [
                    'type'        => 'payment',
                    'description' => "Bayaran RM" . number_format($payment->amount, 2) . " diterima",
                    'date'        => Carbon::parse($payment->payment_date)->toIso8601String(),
                    'icon'        => 'credit-card',
                ];
            }
        }

        // Sort by date descending and limit
        usort($activities, fn($a, $b) => strcmp($b['date'] ?? '', $a['date'] ?? ''));
        return array_slice($activities, 0, $limit);
    }

    private function getAiInsights(?Account $account): array
    {
        if (!$account) {
            return ['credit_score' => null, 'ai_recommendation' => null];
        }

        // Skip AI calls in testing environment
        if (app()->environment('testing')) {
            return ['credit_score' => 720, 'ai_recommendation' => 'Akaun dalam keadaan baik.'];
        }

        try {
            $prompt = "Provide a brief credit health assessment for a TEKUN financing account. "
                . "Outstanding balance: RM{$account->outstanding_balance}. "
                . "Arrears: {$account->arrears_days} days. "
                . "Classification: {$account->classification}. "
                . "Respond in Bahasa Malaysia in 1-2 sentences with a recommendation.";

            $recommendation = $this->getAiTextResponse($prompt, 'Akaun anda dalam keadaan baik. Teruskan pembayaran tepat pada masanya.');

            // Credit score based on arrears and classification
            $score = 750;
            if ($account->arrears_days > 0) $score -= min(200, $account->arrears_days * 2);
            if ($account->classification === 'NPL') $score -= 150;
            if ($account->classification === 'BPL') $score -= 50;
            $score = max(300, min(850, $score));

            return [
                'credit_score'      => $score,
                'ai_recommendation' => $recommendation,
            ];
        } catch (Throwable $e) {
            Log::warning('AI insights failed: ' . $e->getMessage());
            return ['credit_score' => null, 'ai_recommendation' => null];
        }
    }

    private function getAiTextResponse(string $prompt, string $default = ''): string
    {
        // Skip AI calls in testing environment to prevent timeouts
        if (app()->environment('testing')) {
            return $default;
        }

        try {
            $apiBase = config('services.openai.base_uri', env('OPENAI_API_BASE', 'https://api.openai.com/v1'));
            $apiKey  = config('services.openai.key', env('OPENAI_API_KEY', ''));

            if (empty($apiKey)) {
                return $default;
            }

            $response = Http::withHeaders([
                'Authorization' => "Bearer {$apiKey}",
                'Content-Type'  => 'application/json',
            ])->timeout(5)->post("{$apiBase}/chat/completions", [
                'model'      => 'gpt-4o-mini',
                'messages'   => [['role' => 'user', 'content' => $prompt]],
                'max_tokens' => 150,
            ]);

            if ($response->successful()) {
                return $response->json('choices.0.message.content', $default);
            }
        } catch (Throwable $e) {
            Log::warning('AI text response failed: ' . $e->getMessage());
        }
        return $default;
    }

    private function calculateNextInstallmentDate(Account $account): string
    {
        $startDate = Carbon::parse($account->start_date);
        $today     = now();

        // Find the next installment date (same day of month as start date)
        $nextDate = $startDate->copy()->setYear($today->year)->setMonth($today->month);
        if ($nextDate->isPast()) {
            $nextDate->addMonth();
        }
        return $nextDate->format('Y-m-d');
    }

    private function generateAmortisationSchedule(Account $account, int $months = 12): array
    {
        $schedule        = [];
        $balance         = (float) $account->outstanding_balance;
        $monthlyPayment  = (float) $account->monthly_instalment;
        $monthlyRate     = (float) $account->profit_rate / 100 / 12;
        $startDate       = now()->addMonth();

        for ($i = 0; $i < $months && $balance > 0; $i++) {
            $profitPortion    = round($balance * $monthlyRate, 2);
            $principalPortion = round(min($monthlyPayment - $profitPortion, $balance), 2);
            $balance          = max(0, round($balance - $principalPortion, 2));

            $schedule[] = [
                'month'             => $i + 1,
                'due_date'          => $startDate->copy()->addMonths($i)->format('Y-m-d'),
                'payment_amount'    => $monthlyPayment,
                'principal_portion' => $principalPortion,
                'profit_portion'    => $profitPortion,
                'balance'           => $balance,
            ];
        }
        return $schedule;
    }

    private function getStatusLabel(string $status): string
    {
        return match ($status) {
            'draft'       => 'Draf',
            'submitted'   => 'Dihantar',
            'under_review'=> 'Dalam Semakan',
            'approved'    => 'Diluluskan',
            'rejected'    => 'Ditolak',
            'disbursed'   => 'Telah Dikeluarkan',
            'active'      => 'Aktif',
            'closed'      => 'Ditutup',
            'pending'     => 'Dalam Proses',
            'NPL'         => 'Tidak Berbayar',
            'BPL'         => 'Di Bawah Prestasi',
            default        => ucfirst(str_replace('_', ' ', $status)),
        };
    }
}
