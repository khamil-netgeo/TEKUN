<?php
namespace App\Modules\PengurusanNPL\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class NplController extends Controller
{
    public function index(Request $request)
    {
        $records = DB::table('npl_records')
            ->select('id', 'account_id', 'classification', 'days_overdue', 'outstanding', 'ai_risk_level', 'ai_recommendation', 'classified_at')
            ->orderByDesc('days_overdue')
            ->limit(50)
            ->get();
        return response()->json(['data' => $records, 'total' => $records->count()]);
    }

    public function dashboard(Request $request)
    {
        $totalNpl = DB::table('npl_records')->count();
        $totalAccounts = DB::table('accounts')->count();
        $nplRate = $totalAccounts > 0 ? round(($totalNpl / $totalAccounts) * 100, 2) : 0;
        $totalOutstanding = DB::table('npl_records')->sum('outstanding') ?? 0;
        $collectedMtd = DB::table('payments')
            ->whereMonth('paid_at', now()->month)
            ->whereYear('paid_at', now()->year)
            ->sum('amount') ?? 0;
        $totalDue = DB::table('payments')
            ->whereMonth('paid_at', now()->month)
            ->whereYear('paid_at', now()->year)
            ->sum('amount') ?? 0;
        $collectionRate = $totalDue > 0 ? round(($collectedMtd / $totalDue) * 100, 1) : 0;

        $categoryRanges = [
            ['label' => 'Lancar (0 hari)',        'min' => 0,   'max' => 0],
            ['label' => 'Dalam Perhatian (1-30)', 'min' => 1,   'max' => 30],
            ['label' => 'Substandard (31-90)',    'min' => 31,  'max' => 90],
            ['label' => 'Doubtful (91-180)',      'min' => 91,  'max' => 180],
            ['label' => 'Loss (>180 hari)',       'min' => 181, 'max' => 99999],
        ];
        $categories = [];
        foreach ($categoryRanges as $cat) {
            $q = DB::table('npl_records')->whereBetween('days_overdue', [$cat['min'], $cat['max']]);
            $categories[] = ['label' => $cat['label'], 'count' => $q->count(), 'amount' => (float)($q->sum('outstanding') ?? 0)];
        }

        return response()->json([
            'total_npl'         => $totalNpl,
            'npl_rate'          => $nplRate,
            'total_outstanding' => (float)$totalOutstanding,
            'collected_mtd'     => (float)$collectedMtd,
            'collection_rate'   => $collectionRate,
            'categories'        => $categories,
        ]);
    }

    public function nplAccounts(Request $request)
    {
        $classification = $request->query('classification');
        $query = DB::table('npl_records')
            ->join('accounts', 'npl_records.account_id', '=', 'accounts.id')
            ->select('npl_records.*', 'accounts.account_no', 'accounts.borrower_name');
        if ($classification) {
            $query->where('npl_records.classification', $classification);
        }
        return response()->json($query->orderByDesc('npl_records.days_overdue')->paginate(15));
    }

    public function dunningList(Request $request)
    {
        $stage = $request->query('dunning_stage');
        $query = DB::table('npl_records as nr')
            ->join('accounts as a', 'a.id', '=', 'nr.account_id')
            ->select(
                'nr.id',
                'a.account_no',
                'a.borrower_name',
                'nr.days_overdue',
                'nr.outstanding',
                'nr.classification',
                'nr.ai_risk_level',
                DB::raw("CASE
                    WHEN nr.days_overdue <= 30  THEN 'stage1'
                    WHEN nr.days_overdue <= 90  THEN 'stage2'
                    WHEN nr.days_overdue <= 180 THEN 'stage3'
                    ELSE 'stage4'
                END AS dunning_stage")
            );
        if ($stage) {
            $query->whereRaw("CASE
                WHEN nr.days_overdue <= 30  THEN 'stage1'
                WHEN nr.days_overdue <= 90  THEN 'stage2'
                WHEN nr.days_overdue <= 180 THEN 'stage3'
                ELSE 'stage4'
            END = ?", [$stage]);
        }
        $paginated = $query->orderByDesc('nr.days_overdue')->paginate($request->input('per_page', 15));
        return response()->json([
            'data'  => $paginated->items(),
            'total' => $paginated->total(),
            'page'  => $paginated->currentPage(),
        ]);
    }

    public function generateDunning(Request $request)
    {
        $nplIds = $request->input('npl_ids', []);
        $channel = $request->input('channel', 'sms');
        $count = 0;
        foreach ($nplIds as $nplId) {
            $npl = DB::table('npl_records')->where('id', $nplId)->first();
            if ($npl) {
                $exists = DB::table('collection_tasks')
                    ->where('account_id', $npl->account_id)
                    ->where('status', 'pending')
                    ->exists();
                if (!$exists) {
                    DB::table('collection_tasks')->insert([
                        'account_id'  => $npl->account_id,
                        'assigned_to' => auth()->id() ?? 1,
                        'status'      => 'pending',
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ]);
                    $count++;
                }
            }
        }
        return response()->json(['notis_sent' => $count, 'channel' => $channel]);
    }

    public function sendDunning(Request $request, string $id)
    {
        // $id is the account_id
        $channel = $request->input('channel', 'sms');

        // Mark any pending collection tasks for this account as sent
        $updated = DB::table('collection_tasks')
            ->where('account_id', $id)
            ->where('status', 'pending')
            ->update(['status' => 'sent', 'updated_at' => now()]);

        // If no pending tasks, create one and mark sent
        if ($updated === 0) {
            DB::table('collection_tasks')->insert([
                'account_id'  => $id,
                'assigned_to' => auth()->id() ?? 1,
                'status'      => 'sent',
                'follow_up_at'  => now()->addDays(7),
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
            $updated = 1;
        }

        return response()->json([
            'notis_sent' => $updated,
            'channel'    => $channel,
            'account_id' => $id,
        ]);
    }

    public function triggerDunning(Request $request, string $id)
    {
        $outcome = $request->input('outcome', 'no_response');
        $notes   = $request->input('notes', '');
        $updated = DB::table('collection_tasks')->where('id', $id)->update([
            'last_outcome' => $outcome,
            'outcome_notes' => $notes,
            'status' => 'completed',
            'updated_at' => now(),
        ]);
        return response()->json(['success' => $updated > 0, 'id' => $id, 'outcome' => $outcome]);
    }

    /**
     * GET /api/collections/tasks
     * Returns prioritised collection task queue.
     */
    public function collectionTasks(Request $request)
    {
        $tasks = DB::table('collection_tasks as ct')
            ->join('accounts as a', 'a.id', '=', 'ct.account_id')
            ->select(
                'ct.id',
                'a.account_no',
                'a.borrower_name',
                'a.arrears_days',
                'a.arrears_amount',
                'ct.priority_score',
                'ct.status',
                'ct.follow_up_at',
                'ct.assigned_to',
                'ct.ai_recommendation'
            )
            ->orderByDesc('ct.priority_score')
            ->paginate($request->input('per_page', 15));

        return response()->json($tasks);
    }

    /**
     * POST /api/collections/tasks/{id}/outcome
     * Log the outcome of a collection task.
     */
    public function logOutcome(Request $request, string $id)
    {
        $outcome      = $request->input('outcome', 'no_response');
        $notes        = $request->input('notes', '');
        $followUpDays = (int) $request->input('follow_up_days', 7);

        $updated = DB::table('collection_tasks')
            ->where('id', $id)
            ->update([
                'last_outcome'    => $outcome,
                'outcome_notes'   => $notes,
                'status'          => 'completed',
                'follow_up_at'    => now()->addDays($followUpDays),
                'last_contacted_at' => now(),
                'updated_at'      => now(),
            ]);

        return response()->json([
            'success'        => $updated > 0,
            'id'             => $id,
            'outcome'        => $outcome,
            'next_follow_up' => now()->addDays($followUpDays)->toDateString(),
        ]);
    }
}
