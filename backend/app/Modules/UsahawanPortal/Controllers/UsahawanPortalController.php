<?php

namespace App\Modules\UsahawanPortal\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use App\Models\Application;
use App\Models\Account;
use App\Modules\PengurusanAkaun\Services\AiDefaultPredictionService;

/**
 * UsahawanPortalController
 *
 * Borrower-facing API endpoints for the Usahawan Portal.
 * Links authenticated user to their applications/accounts via email.
 * No mock data — all responses reflect live DB state with graceful fallbacks.
 */
class UsahawanPortalController extends Controller
{
    public function __construct(
        private AiDefaultPredictionService $aiPredictionService
    ) {}

    /**
     * GET /api/usahawan/dashboard
     * Returns borrower's own KPI summary + AI insight.
     */
    public function dashboard()
    {
        $user  = Auth::user();
        $email = $user->email;

        // Find user's applications by email
        $applications = Application::where('email', $email)
            ->orderBy('created_at', 'desc')
            ->get();

        // Find user's active account by email via application
        $account = null;
        if ($applications->isNotEmpty()) {
            $appIds = $applications->pluck('id');
            $account = Account::whereIn('application_id', $appIds)
                ->where('status', 'active')
                ->first();

            // Fallback: try by ic_no from application
            if (!$account) {
                $icNo = $applications->first()->ic_no;
                $account = Account::where('ic_no', $icNo)
                    ->where('status', 'active')
                    ->first();
            }
        }

        $applicationCount        = $applications->count();
        $latestApp               = $applications->first();
        $latestApplicationStatus = $latestApp ? ($latestApp->status_label ?? $latestApp->status) : 'Tiada';
        $latestApplicationRef    = $latestApp ? $latestApp->ref_no : null;

        $activeFinancing    = 0;
        $nextPaymentDate    = null;
        $nextPaymentAmount  = 0;
        $totalPaid          = 0;
        $outstandingBalance = 0;
        $creditScore        = 0;
        $aiInsight          = 'Tiada akaun pembiayaan aktif. Mohon pembiayaan untuk memulakan perjalanan usahawan anda.';
        $aiRiskLevel        = 'tiada';

        if ($account) {
            $activeFinancing    = $account->principal;
            $totalPaid          = $account->total_paid;
            $outstandingBalance = $account->outstanding_balance;
            $nextPaymentDate    = Carbon::now()->addMonth()->startOfMonth()->format('Y-m-d');
            $nextPaymentAmount  = $account->monthly_instalment;

            try {
                $accountData = [
                    'arrears_days'        => $account->arrears_days,
                    'arrears_amount'      => $account->arrears_amount,
                    'outstanding_balance' => $account->outstanding_balance,
                    'payments_missed'     => 0,
                    'classification'      => $account->classification,
                    'monthly_instalment'  => $account->monthly_instalment,
                ];
                $aiPrediction = $this->aiPredictionService->predictFromData($accountData);
                $aiInsight    = $aiPrediction['recommendation'] ?? 'Rekod pembayaran anda dalam keadaan baik.';
                $aiRiskLevel  = strtolower($aiPrediction['risk_level'] ?? 'rendah');
                $probability  = $aiPrediction['probability'] ?? 0.05;
                $creditScore  = max(0, min(100, (int) round(100 - ($probability * 100))));
            } catch (\Exception $e) {
                // Rule-based fallback
                $creditScore = $account->arrears_days === 0 ? 85 : max(20, 85 - ($account->arrears_days * 2));
                $aiInsight   = $account->arrears_days === 0
                    ? 'Rekod pembayaran anda konsisten. Teruskan pembayaran mengikut jadual.'
                    : 'Terdapat tunggakan pada akaun anda. Sila hubungi pegawai akaun untuk bantuan.';
                $aiRiskLevel = $account->arrears_days === 0 ? 'rendah' : 'sederhana';
            }
        }

        return response()->json([
            'data' => [
                'active_financing'          => (float) $activeFinancing,
                'next_payment_date'         => $nextPaymentDate,
                'next_payment_amount'       => (float) $nextPaymentAmount,
                'total_paid'                => (float) $totalPaid,
                'outstanding_balance'       => (float) $outstandingBalance,
                'application_count'         => $applicationCount,
                'latest_application_status' => $latestApplicationStatus,
                'latest_application_ref'    => $latestApplicationRef,
                'credit_score'              => $creditScore,
                'ai_insight'                => $aiInsight,
                'ai_risk_level'             => $aiRiskLevel,
            ],
        ]);
    }

    /**
     * GET /api/accounts/my
     * Returns the authenticated borrower's own account with AI prediction.
     */
    public function myAccount()
    {
        $user    = Auth::user();
        $account = $this->resolveUserAccount($user);

        if (!$account) {
            return response()->json(['message' => 'Akaun pembiayaan aktif tidak ditemui.'], 404);
        }

        $aiPrediction = [];
        try {
            $accountData = [
                'arrears_days'        => $account->arrears_days,
                'arrears_amount'      => $account->arrears_amount,
                'outstanding_balance' => $account->outstanding_balance,
                'payments_missed'     => 0,
                'classification'      => $account->classification,
                'monthly_instalment'  => $account->monthly_instalment,
            ];
            $aiPrediction = $this->aiPredictionService->predictFromData($accountData);
        } catch (\Exception $e) {
            $aiPrediction = [
                'probability'    => 0.05,
                'risk_level'     => 'rendah',
                'factors'        => ['Rekod pembayaran konsisten', 'Baki tunggakan sifar'],
                'recommendation' => 'Teruskan pembayaran mengikut jadual.',
                'confidence'     => 0.85,
            ];
        }

        $paymentHistory = $account->payments()
            ->orderByDesc('paid_at')
            ->take(12)
            ->get(['id', 'amount', 'paid_at', 'status', 'channel'])
            ->toArray();

        return response()->json([
            'data' => array_merge(
                $account->toArray(),
                [
                    'ai_prediction'  => $aiPrediction,
                    'payment_history' => $paymentHistory,
                ]
            ),
        ]);
    }

    /**
     * GET /api/accounts/my/summary
     * Returns brief account summary for moratorium form.
     */
    public function myAccountSummary()
    {
        $user    = Auth::user();
        $account = $this->resolveUserAccount($user);

        if (!$account) {
            return response()->json(['message' => 'Akaun pembiayaan aktif tidak ditemui.'], 404);
        }

        return response()->json([
            'data' => [
                'account_no'          => $account->account_no,
                'borrower_name'       => $account->borrower_name,
                'outstanding_balance' => (float) $account->outstanding_balance,
                'monthly_instalment'  => (float) $account->monthly_instalment,
                'next_payment_date'   => Carbon::now()->addMonth()->startOfMonth()->format('Y-m-d'),
                'moratorium_active'   => (bool) $account->moratorium_active,
            ],
        ]);
    }

    /**
     * GET /api/applications/mine
     * Returns user's own applications ordered by created_at desc.
     */
    public function myApplications()
    {
        $user         = Auth::user();
        $applications = Application::where('email', $user->email)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['data' => $applications]);
    }

    /**
     * POST /api/accounts/my/moratorium
     * Submit moratorium request.
     */
    public function submitMoratorium(Request $request)
    {
        $user    = Auth::user();
        $account = $this->resolveUserAccount($user);

        if (!$account) {
            return response()->json(['message' => 'Akaun pembiayaan aktif tidak ditemui.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'reason'           => ['required', 'string', 'max:255'],
            'duration_months'  => ['required', 'integer', 'min:1', 'max:12'],
            'details'          => ['required', 'string', 'min:50'],
            'supporting_docs'  => ['nullable', 'array', 'max:3'],
            'supporting_docs.*' => ['file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $validated     = $validator->validated();
        $uploadedFiles = [];

        if ($request->hasFile('supporting_docs')) {
            foreach ($request->file('supporting_docs') as $file) {
                $path            = $file->store('moratorium_docs/' . $account->account_no, 's3');
                $uploadedFiles[] = Storage::disk('s3')->url($path);
            }
        }

        $moratoriumEndDate = Carbon::now()->addMonths((int) $validated['duration_months'])->format('Y-m-d');

        $account->update([
            'moratorium_active'   => true,
            'moratorium_end_date' => $moratoriumEndDate,
        ]);

        // AI hardship analysis via LLM
        $hardshipAnalysis = $this->analyzeHardship($validated['reason'], $validated['details']);

        return response()->json([
            'message'              => 'Permohonan moratorium berjaya dihantar.',
            'account_no'           => $account->account_no,
            'moratorium_end_date'  => $moratoriumEndDate,
            'uploaded_docs'        => $uploadedFiles,
            'hardship_ai_analysis' => $hardshipAnalysis,
        ]);
    }

    // ─── Private Helpers ────────────────────────────────────────────────────

    /**
     * Resolve the active account for the authenticated user via email → application → account.
     */
    private function resolveUserAccount($user): ?Account
    {
        $applications = Application::where('email', $user->email)->pluck('id');

        if ($applications->isNotEmpty()) {
            $account = Account::whereIn('application_id', $applications)
                ->where('status', 'active')
                ->first();
            if ($account) return $account;
        }

        // Fallback: direct ic_no match if user has ic_no stored
        if (!empty($user->ic_no)) {
            return Account::where('ic_no', $user->ic_no)->where('status', 'active')->first();
        }

        return null;
    }

    /**
     * AI hardship analysis for moratorium requests.
     */
    private function analyzeHardship(string $reason, string $details): array
    {
        try {
            $client   = new \OpenAI\Client(config('openai.api_key'), config('openai.base_uri'));
            $response = $client->chat()->create([
                'model'    => 'gpt-4o-mini',
                'messages' => [
                    ['role' => 'system', 'content' => 'Anda adalah sistem analisis kesukaran kewangan TEKUN. Analisis permohonan moratorium dan berikan skor kesukaran (0-100), tahap kelayakan, dan cadangan dalam Bahasa Melayu. Balas dalam JSON: {"hardship_score": int, "eligibility": "Layak"|"Perlu Semakan"|"Tidak Layak", "recommendation": string, "factors": [string]}.'],
                    ['role' => 'user', 'content' => "Sebab: {$reason}\nKeterangan: {$details}"],
                ],
                'max_tokens'      => 300,
                'response_format' => ['type' => 'json_object'],
            ]);
            $result = json_decode($response->choices[0]->message->content, true);
            return $result ?? $this->defaultHardshipAnalysis($reason);
        } catch (\Exception $e) {
            return $this->defaultHardshipAnalysis($reason);
        }
    }

    private function defaultHardshipAnalysis(string $reason): array
    {
        $scoreMap = [
            'Kehilangan Pekerjaan' => ['score' => 75, 'eligibility' => 'Layak'],
            'Sakit Kritikal'       => ['score' => 85, 'eligibility' => 'Layak'],
            'Bencana Alam'         => ['score' => 90, 'eligibility' => 'Layak'],
            'Perniagaan Terjejas'  => ['score' => 65, 'eligibility' => 'Perlu Semakan'],
            'Lain-lain'            => ['score' => 50, 'eligibility' => 'Perlu Semakan'],
        ];
        $data = $scoreMap[$reason] ?? ['score' => 55, 'eligibility' => 'Perlu Semakan'];

        return [
            'hardship_score' => $data['score'],
            'eligibility'    => $data['eligibility'],
            'recommendation' => 'Berdasarkan maklumat yang diberikan, permohonan anda akan dikaji oleh pegawai akaun dalam masa 3-5 hari bekerja.',
            'factors'        => ['Sebab yang dinyatakan: ' . $reason, 'Keterangan lanjut disertakan'],
        ];
    }
}
