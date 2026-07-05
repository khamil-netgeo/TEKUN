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
            ->whereMonth('payment_date', now()->month)
            ->whereYear('payment_date', now()->year)
            ->sum('amount') ?? 0;
        $totalDue = DB::table('payments')
            ->whereMonth('payment_date', now()->month)
            ->whereYear('payment_date', now()->year)
            ->sum('amount_due') ?? 0;
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
            $categories[] = ['label' => $cat['label'], 'count' => $q->count(), 'amount' => $q->sum('outstanding') ?? 0];
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

    public function nplAccounts(Request $request)
    {
        $classification = $request->query('classification');
        $query = DB::table('npl_records')
            ->join('accounts', 'npl_records.account_id', '=', 'accounts.id')
            ->select('npl_records.*', 'accounts.account_no', 'accounts.applicant_name');
        if ($classification) {
            $query->where('npl_records.classification', $classification);
        }
        return response()->json($query->orderByDesc('npl_records.days_overdue')->paginate(15));
    }

    public function dunningList(Request $request)
    {
        $stage = $request->query('dunning_stage');
        $query = DB::table('collection_tasks')
            ->join('npl_records', 'collection_tasks.npl_record_id', '=', 'npl_records.id')
            ->select('collection_tasks.*', 'npl_records.outstanding', 'npl_records.days_overdue');
        if ($stage) {
            $query->where('collection_tasks.dunning_stage', $stage);
        }
        return response()->json($query->orderByDesc('collection_tasks.created_at')->paginate(15));
    }

    public function generateDunning(Request $request)
    {
        $nplIds = $request->input('npl_ids', []);
        $channel = $request->input('channel', 'sms');
        $count = 0;
        foreach ($nplIds as $nplId) {
            $exists = DB::table('collection_tasks')->where('npl_record_id', $nplId)->where('status', 'pending')->exists();
            if (!$exists) {
                DB::table('collection_tasks')->insert([
                    'npl_record_id' => $nplId, 'dunning_stage' => 'stage1',
                    'channel' => $channel, 'status' => 'pending',
                    'created_at' => now(), 'updated_at' => now(),
                ]);
                $count++;
            }
        }
        return response()->json(['notis_sent' => $count, 'channel' => $channel]);
    }

    public function sendDunning(Request $request, string $id)
    {
        $updated = DB::table('collection_tasks')->where('id', $id)->update(['status' => 'sent', 'sent_at' => now(), 'updated_at' => now()]);
        return response()->json(['success' => $updated > 0, 'id' => $id]);
    }

    public function triggerDunning(Request $request, string $id)
    {
        $outcome = $request->input('outcome', 'no_response');
        $notes   = $request->input('notes', '');
        $updated = DB::table('collection_tasks')->where('id', $id)->update(['outcome' => $outcome, 'notes' => $notes, 'status' => 'completed', 'updated_at' => now()]);
        return response()->json(['success' => $updated > 0, 'id' => $id, 'outcome' => $outcome]);
    }
}
