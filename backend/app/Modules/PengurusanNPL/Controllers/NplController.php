<?php

namespace App\Modules\PengurusanNPL\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\AiService;

class NplController extends Controller
{
    protected AiService $aiService;

    public function __construct(AiService $aiService)
    {
        $this->aiService = $aiService;
    }

    /**
     * GET /api/npl/dashboard
     * Returns aggregated NPL stats with AI prediction
     */
    public function dashboard(Request $request)
    {
        try {
            // Total accounts and NPL accounts
            $totalAccounts = DB::table('accounts')->count();
            $nplAccounts = DB::table('accounts')
                ->whereIn('classification', ['substandard', 'doubtful', 'loss'])
                ->count();

            $ratio = $totalAccounts > 0
                ? round(($nplAccounts / $totalAccounts) * 100, 2)
                : 0;

            // Classification breakdown from npl_records
            $classificationBreakdown = DB::table('npl_records')
                ->select('classification', DB::raw('COUNT(*) as count'), DB::raw('SUM(outstanding) as total_outstanding'))
                ->groupBy('classification')
                ->get()
                ->keyBy('classification');

            // By branch: join accounts with applications with branches
            $byBranch = DB::table('npl_records as n')
                ->join('accounts as a', 'n.account_id', '=', 'a.id')
                ->join('applications as ap', 'a.application_id', '=', 'ap.id')
                ->join('branches as b', 'ap.branch_id', '=', 'b.id')
                ->select('b.name as branch', DB::raw('COUNT(*) as npl_count'), DB::raw('SUM(n.outstanding) as total_outstanding'))
                ->groupBy('b.id', 'b.name')
                ->orderByDesc('npl_count')
                ->limit(10)
                ->get();

            // By sector
            $bySector = DB::table('npl_records as n')
                ->join('accounts as a', 'n.account_id', '=', 'a.id')
                ->join('applications as ap', 'a.application_id', '=', 'ap.id')
                ->select('ap.sector', DB::raw('COUNT(*) as npl_count'), DB::raw('SUM(n.outstanding) as total_outstanding'))
                ->whereNotNull('ap.sector')
                ->groupBy('ap.sector')
                ->orderByDesc('npl_count')
                ->get();

            // Monthly trend (last 6 months)
            $monthlyTrend = DB::table('npl_records')
                ->select(
                    DB::raw("TO_CHAR(classified_at, 'YYYY-MM') as month"),
                    DB::raw('COUNT(*) as count'),
                    DB::raw('SUM(outstanding) as outstanding')
                )
                ->where('classified_at', '>=', now()->subMonths(6))
                ->groupBy(DB::raw("TO_CHAR(classified_at, 'YYYY-MM')"))
                ->orderBy('month')
                ->get();

            // AI prediction
            $aiPrediction = null;
            try {
                $context = "NPL ratio: {$ratio}%, Total NPL accounts: {$nplAccounts}, Total accounts: {$totalAccounts}";
                $prediction = $this->aiService->predictNplRisk($context);
                $aiPrediction = is_array($prediction) ? ($prediction['prediction'] ?? $prediction) : $prediction;
            } catch (\Throwable $e) {
                Log::warning('AI NPL prediction failed: ' . $e->getMessage());
                $aiPrediction = [
                    'predicted_npl_next_quarter' => round($ratio * 1.05, 2),
                    'risk_level' => $ratio > 5 ? 'tinggi' : ($ratio > 3 ? 'sederhana' : 'rendah'),
                    'recommendation' => 'Tingkatkan usaha kutipan untuk akaun berisiko tinggi.',
                ];
            }

            return response()->json([
                'total_npl' => $nplAccounts,
                'total_accounts' => $totalAccounts,
                'ratio' => $ratio,
                'bnm_threshold' => 5.0,
                'classification_breakdown' => $classificationBreakdown,
                'by_branch' => $byBranch,
                'by_sector' => $bySector,
                'monthly_trend' => $monthlyTrend,
                'ai_prediction' => $aiPrediction,
            ]);
        } catch (\Throwable $e) {
            Log::error('NPL dashboard error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/npl/dunning
     * Returns list of NPL accounts for dunning
     */
    public function dunningList(Request $request)
    {
        try {
            $query = DB::table('npl_records as n')
                ->join('accounts as a', 'n.account_id', '=', 'a.id')
                ->join('applications as ap', 'a.application_id', '=', 'ap.id')
                ->select(
                    'n.id',
                    'n.account_id',
                    'a.account_no',
                    'a.borrower_name',
                    'a.arrears_days',
                    'a.arrears_amount',
                    'a.outstanding_balance',
                    'a.classification',
                    'n.ai_risk_level',
                    'n.days_overdue',
                    'n.outstanding',
                    'ap.sector',
                    DB::raw("CASE
                        WHEN a.arrears_days <= 30 THEN 'stage1'
                        WHEN a.arrears_days <= 90 THEN 'stage2'
                        WHEN a.arrears_days <= 180 THEN 'stage3'
                        ELSE 'stage4'
                    END as dunning_stage")
                )
                ->orderByDesc('a.arrears_days');

            if ($request->has('stage')) {
                $stage = $request->stage;
                $stageMap = [
                    'stage1' => [1, 30],
                    'stage2' => [31, 90],
                    'stage3' => [91, 180],
                    'stage4' => [181, 9999],
                ];
                if (isset($stageMap[$stage])) {
                    $query->whereBetween('a.arrears_days', $stageMap[$stage]);
                }
            }

            $records = $query->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $records->items(),
                'meta' => [
                    'total' => $records->total(),
                    'per_page' => $records->perPage(),
                    'current_page' => $records->currentPage(),
                    'last_page' => $records->lastPage(),
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('NPL dunning list error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/collections/dunning/{account_id}
     * Generate AI dunning notice for an account
     */
    public function generateDunning(Request $request, $accountId)
    {
        try {
            $account = DB::table('accounts as a')
                ->join('applications as ap', 'a.application_id', '=', 'ap.id')
                ->where('a.id', $accountId)
                ->select(
                    'a.*',
                    'ap.sector',
                    'ap.scheme'
                )
                ->first();

            if (!$account) {
                return response()->json(['error' => 'Akaun tidak dijumpai.'], 404);
            }

            // Determine dunning stage and channel
            $days = $account->arrears_days ?? 0;
            if ($days <= 30) {
                $stage = 1;
                $channel = 'SMS/E-mel';
                $channelCode = 'sms_email';
            } elseif ($days <= 90) {
                $stage = 2;
                $channel = 'Surat Rasmi';
                $channelCode = 'letter';
            } elseif ($days <= 180) {
                $stage = 3;
                $channel = 'Notis Rasmi';
                $channelCode = 'formal_notice';
            } else {
                $stage = 4;
                $channel = 'Rujukan Litigasi';
                $channelCode = 'litigation';
            }

            // Generate AI dunning letter
            $aiNotice = null;
            $aiGenerated = false;
            try {
                $borrowerProfile = [
                    'name' => $account->borrower_name,
                    'account_no' => $account->account_no,
                    'arrears_days' => $days,
                    'arrears_amount' => $account->arrears_amount,
                    'outstanding' => $account->outstanding_balance,
                    'sector' => $account->sector ?? 'Perniagaan',
                    'stage' => $stage,
                ];
                $aiNotice = $this->aiService->generateDunningLetter($borrowerProfile);
                $aiGenerated = true;
            } catch (\Throwable $e) {
                Log::warning('AI dunning letter generation failed: ' . $e->getMessage());
                $aiNotice = "Notis dunning Peringkat {$stage} untuk {$account->borrower_name} — Akaun {$account->account_no}. Tunggakan: RM " . number_format($account->arrears_amount, 2) . " ({$days} hari). Sila hubungi TEKUN Nasional segera.";
            }

            // Log dunning action
            DB::table('dunning_actions')->insert([
                'account_id' => $accountId,
                'action_type' => "stage{$stage}_dunning",
                'channel' => $channelCode,
                'notes' => is_array($aiNotice) ? json_encode($aiNotice) : $aiNotice,
                'actioned_by' => $request->user()?->id,
                'actioned_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'notis_sent' => true,
                'channel' => $channel,
                'stage' => $stage,
                'borrower_name' => $account->borrower_name,
                'account_no' => $account->account_no,
                'arrears_days' => $days,
                'ai_generated' => $aiGenerated,
                'ai_notice' => $aiNotice,
            ]);
        } catch (\Throwable $e) {
            Log::error('NPL dunning generation error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/collections/tasks
     * Returns AI-prioritized collection task queue
     */
    public function collectionTasks(Request $request)
    {
        try {
            $tasks = DB::table('collection_tasks as ct')
                ->join('accounts as a', 'ct.account_id', '=', 'a.id')
                ->select(
                    'ct.id',
                    'ct.account_id',
                    'a.account_no',
                    'a.borrower_name',
                    'a.arrears_days',
                    'a.arrears_amount',
                    'a.classification',
                    'ct.status',
                    'ct.priority_score',
                    'ct.ai_suggested_channel',
                    'ct.ai_recommendation',
                    'ct.last_outcome',
                    'ct.attempt_count',
                    'ct.follow_up_at',
                    'ct.created_at'
                )
                ->where('ct.status', '!=', 'closed')
                ->orderByDesc('ct.priority_score')
                ->orderByDesc('a.arrears_days')
                ->paginate(20);

            return response()->json([
                'success' => true,
                'ai_prioritized' => true,
                'data' => $tasks->items(),
                'meta' => [
                    'total' => $tasks->total(),
                    'per_page' => $tasks->perPage(),
                    'current_page' => $tasks->currentPage(),
                    'last_page' => $tasks->lastPage(),
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Collection tasks error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * POST /api/collections/tasks/{id}/outcome
     * Log call outcome for a collection task
     */
    public function logOutcome(Request $request, $id)
    {
        $request->validate([
            'outcome' => 'required|string|max:1000',
            'follow_up_at' => 'nullable|date',
            'status' => 'nullable|in:pending,in_progress,resolved,closed',
        ]);

        try {
            $task = DB::table('collection_tasks')->where('id', $id)->first();

            if (!$task) {
                return response()->json(['error' => 'Tugasan tidak dijumpai.'], 404);
            }

            DB::table('collection_tasks')->where('id', $id)->update([
                'last_outcome' => $request->outcome,
                'attempt_count' => $task->attempt_count + 1,
                'status' => $request->status ?? 'in_progress',
                'follow_up_at' => $request->follow_up_at,
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Hasil panggilan direkod.',
                'task_id' => $id,
                'attempt_count' => $task->attempt_count + 1,
            ]);
        } catch (\Throwable $e) {
            Log::error('Log outcome error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * GET /api/accounts (with classification filter)
     * Returns accounts filtered by classification
     */
    public function accounts(Request $request)
    {
        try {
            $query = DB::table('accounts as a')
                ->join('applications as ap', 'a.application_id', '=', 'ap.id')
                ->select(
                    'a.id',
                    'a.account_no',
                    'a.borrower_name',
                    'a.ic_no',
                    'a.outstanding_balance',
                    'a.arrears_amount',
                    'a.arrears_days',
                    'a.classification',
                    'a.monthly_instalment',
                    'ap.sector',
                    'ap.scheme'
                );

            if ($request->has('classification')) {
                $query->where('a.classification', $request->classification);
            }

            $accounts = $query->orderByDesc('a.arrears_days')->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $accounts->items(),
                'meta' => [
                    'total' => $accounts->total(),
                    'per_page' => $accounts->perPage(),
                    'current_page' => $accounts->currentPage(),
                    'last_page' => $accounts->lastPage(),
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Accounts list error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
