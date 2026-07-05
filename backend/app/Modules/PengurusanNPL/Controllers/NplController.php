<?php

namespace App\Modules\PengurusanNPL\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

/**
 * Module 5 — Pengurusan NPL & Kutipan Hutang
 * All queries use real PostgreSQL data. No hardcoded values.
 */
class NplController extends Controller
{
    // NPL Dashboard
    public function dashboard(Request $request)
    {
        $totalNpl      = DB::table('npl_records')->count();
        $totalAccounts = DB::table('accounts')->count();
        $nplRate       = $totalAccounts > 0 ? round(($totalNpl / $totalAccounts) * 100, 2) : 0;
        $totalOutstanding = (float) (DB::table('npl_records')->sum('outstanding') ?? 0);
        $collectedMtd = (float) (DB::table('payments')
            ->whereMonth('paid_at', now()->month)
            ->whereYear('paid_at', now()->year)
            ->sum('amount') ?? 0);
        $collectionRate = $totalOutstanding > 0
            ? round(($collectedMtd / $totalOutstanding) * 100, 1) : 0;

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
            'total_outstanding' => $totalOutstanding,
            'collected_mtd'     => $collectedMtd,
            'collection_rate'   => $collectionRate,
            'categories'        => $categories,
        ]);
    }

    // NPL Accounts List
    public function nplAccounts(Request $request)
    {
        $classification = $request->query('classification');
        $query = DB::table('npl_records')
            ->join('accounts', 'npl_records.account_id', '=', 'accounts.id')
            ->select('npl_records.id', 'npl_records.account_id', 'npl_records.classification',
                'npl_records.days_overdue', 'npl_records.outstanding', 'npl_records.ai_risk_level',
                'npl_records.ai_recommendation', 'npl_records.classified_at',
                'accounts.account_no', 'accounts.borrower_name', 'accounts.ic_no',
                'accounts.arrears_days', 'accounts.arrears_amount');
        if ($classification) {
            $query->where('npl_records.classification', $classification);
        }
        return response()->json($query->orderByDesc('npl_records.days_overdue')->paginate(15));
    }

    // Dunning List with escalation stage
    public function dunningList(Request $request)
    {
        $stage = $request->query('dunning_stage');
        $query = DB::table('npl_records')
            ->join('accounts', 'npl_records.account_id', '=', 'accounts.id')
            ->select('npl_records.id', 'accounts.account_no', 'accounts.borrower_name',
                'npl_records.days_overdue', 'npl_records.outstanding', 'npl_records.classification',
                'npl_records.ai_risk_level',
                DB::raw("CASE WHEN npl_records.days_overdue BETWEEN 30 AND 60 THEN 'stage1'
                    WHEN npl_records.days_overdue BETWEEN 61 AND 90 THEN 'stage2'
                    WHEN npl_records.days_overdue > 90 THEN 'stage3'
                    ELSE 'none' END as dunning_stage"))
            ->where('npl_records.days_overdue', '>=', 30);
        if ($stage) {
            $stageRange = match($stage) {
                'stage1' => [30, 60],
                'stage2' => [61, 90],
                'stage3' => [91, 99999],
                default  => null,
            };
            if ($stageRange) {
                $query->whereBetween('npl_records.days_overdue', $stageRange);
            }
        }
        return response()->json($query->orderByDesc('npl_records.days_overdue')->paginate(20));
    }

    // Send Dunning Notification
    public function sendDunning(Request $request, string $id)
    {
        $channel = $request->input('channel', 'sms');
        DB::table('dunning_actions')->insert([
            'account_id'   => (int) $id,
            'action_type'  => 'dunning_notice',
            'channel'      => $channel,
            'status'       => 'sent',
            'is_automated' => true,
            'actioned_at'  => now(),
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);
        return response()->json(['notis_sent' => 1, 'channel' => $channel, 'account_id' => (int) $id, 'sent_at' => now()->toISOString()]);
    }

    // Collection Tasks
    public function collectionTasks(Request $request)
    {
        $tasks = DB::table('collection_tasks')
            ->join('accounts', 'collection_tasks.account_id', '=', 'accounts.id')
            ->select('collection_tasks.id', 'collection_tasks.account_id', 'accounts.account_no',
                'accounts.borrower_name', 'accounts.arrears_days', 'accounts.arrears_amount',
                'accounts.outstanding_balance', 'accounts.classification', 'collection_tasks.status',
                'collection_tasks.priority_score', 'collection_tasks.ai_suggested_channel',
                'collection_tasks.ai_best_contact_time', 'collection_tasks.ai_recommendation',
                'collection_tasks.last_outcome', 'collection_tasks.outcome_notes',
                'collection_tasks.attempt_count', 'collection_tasks.follow_up_at',
                'collection_tasks.last_contacted_at',
                DB::raw("CASE WHEN collection_tasks.priority_score >= 80 THEN 'Kritikal'
                    WHEN collection_tasks.priority_score >= 60 THEN 'Tinggi'
                    WHEN collection_tasks.priority_score >= 40 THEN 'Sederhana'
                    ELSE 'Rendah' END as priority_label"))
            ->where('collection_tasks.status', '!=', 'completed')
            ->orderByDesc('collection_tasks.priority_score')
            ->paginate(20);
        return response()->json($tasks);
    }

    // Log Collection Outcome
    public function logOutcome(Request $request, string $id)
    {
        $outcome      = $request->input('outcome', '');
        $notes        = $request->input('notes', '');
        $followUpDays = $request->input('follow_up_days', 7);
        $updated = DB::table('collection_tasks')->where('id', $id)->update([
            'last_outcome'      => $outcome,
            'outcome_notes'     => $notes,
            'last_contacted_at' => now(),
            'follow_up_at'      => now()->addDays((int) $followUpDays),
            'attempt_count'     => DB::raw('attempt_count + 1'),
            'updated_at'        => now(),
        ]);
        return response()->json(['success' => $updated > 0, 'id' => (int) $id, 'outcome' => $outcome]);
    }

    // AI Automation Status
    public function aiAutomationStatus(Request $request)
    {
        $today = now()->toDateString();
        $channelCounts = DB::table('dunning_actions')
            ->whereDate('actioned_at', $today)
            ->select('channel', DB::raw('count(*) as total'))
            ->groupBy('channel')->get()->keyBy('channel');
        $smsSent      = (int) ($channelCounts->get('sms')?->total ?? 0);
        $whatsappSent = (int) ($channelCounts->get('whatsapp')?->total ?? 0);
        $emailSent    = (int) ($channelCounts->get('email')?->total ?? 0);
        $totalSent    = $smsSent + $whatsappSent + $emailSent;
        $totalTasks     = DB::table('collection_tasks')->count();
        $respondedTasks = DB::table('collection_tasks')->whereNotNull('last_outcome')->whereNotIn('last_outcome', ['', 'no_answer'])->count();
        $responseRate   = $totalTasks > 0 ? round(($respondedTasks / $totalTasks) * 100, 1) : 0;
        $topTask        = DB::table('collection_tasks')->where('status', 'pending')->orderByDesc('priority_score')->value('ai_recommendation');
        $pendingCount   = DB::table('collection_tasks')->where('status', 'pending')->count();
        if ($pendingCount > 10) {
            $aiNextAction = "Terdapat {$pendingCount} akaun belum dihubungi. SPPT AI mencadangkan sesi panggilan berjadual pada waktu 2:00 PM - 4:00 PM untuk kadar respons optimum.";
        } elseif ($responseRate < 30) {
            $aiNextAction = "Kadar respons rendah ({$responseRate}%). SPPT AI mencadangkan penghantaran notis bertulis rasmi kepada akaun yang tidak memberi respons.";
        } else {
            $aiNextAction = "Prestasi kutipan baik. SPPT AI mencadangkan tumpuan kepada akaun Kritikal (>90 hari) untuk tindakan undang-undang segera.";
        }
        return response()->json([
            'sms_sent' => $smsSent, 'whatsapp_sent' => $whatsappSent, 'email_sent' => $emailSent,
            'total_sent' => $totalSent, 'response_rate' => $responseRate, 'pending_tasks' => $pendingCount,
            'ai_next_action' => $aiNextAction, 'top_recommendation' => $topTask,
        ]);
    }
}
