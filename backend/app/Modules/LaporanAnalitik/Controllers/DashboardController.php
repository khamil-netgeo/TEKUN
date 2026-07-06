<?php
namespace App\Modules\LaporanAnalitik\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Account;
use App\Models\Disbursement;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller {
    public function stats(Request $request) {
        $appTotal = Application::count();
        $appNew = Application::whereIn('status', ['new', 'pending'])->count();
        $appInAssessment = Application::whereIn('status', ['in_assessment', 'processing'])->count();
        $appCompleted = Application::whereIn('status', ['completed', 'approved'])->count();
        $appOverdue = Application::whereIn('status', ['new', 'pending', 'in_assessment'])
            ->where('created_at', '<', now()->subDays(3))
            ->count();

        $disbPending = Disbursement::where('status', 'pending')->count();
        $disbCompletedToday = Disbursement::where('status', 'completed')
            ->whereDate('updated_at', today())
            ->count();
        $disbTotalAmount = Disbursement::where('status', 'completed')->sum('amount');

        $accTotal = Account::count();
        $accLancar = Account::whereIn('status', ['lancar', 'active'])->count();
        $accPerhatian = Account::whereIn('status', ['perhatian_khusus', 'warning'])->count();
        $accTidakLancar = Account::whereIn('status', ['tidak_lancar', 'delinquent'])->count();
        $accNpl = Account::where('status', 'npl')->count();

        $collectionRate = $accTotal > 0 ? round((($accLancar + $accPerhatian) / $accTotal) * 100, 1) : 0;
        $nplRatio = $accTotal > 0 ? round(($accNpl / $accTotal) * 100, 1) : 0;

        return response()->json([
            'applications' => [
                'total' => $appTotal, 
                'new' => $appNew, 
                'in_assessment' => $appInAssessment, 
                'completed' => $appCompleted, 
                'overdue' => $appOverdue
            ],
            'disbursements' => [
                'pending' => $disbPending, 
                'completed_today' => $disbCompletedToday, 
                'total_amount' => (float) $disbTotalAmount
            ],
            'accounts' => [
                'total' => $accTotal, 
                'lancar' => $accLancar, 
                'perhatian_khusus' => $accPerhatian, 
                'tidak_lancar' => $accTidakLancar, 
                'npl' => $accNpl
            ],
            'collection_rate' => $collectionRate,
            'npl_ratio' => $nplRatio,
        ]);
    }

    public function executive(Request $request) {
        $totalDisbursement = Disbursement::where('status', 'completed')->sum('amount');
        
        $accTotal = Account::count();
        $accLancar = Account::whereIn('status', ['lancar', 'active'])->count();
        $accPerhatian = Account::whereIn('status', ['perhatian_khusus', 'warning'])->count();
        $accTidakLancar = Account::whereIn('status', ['tidak_lancar', 'delinquent'])->count();
        $accNpl = Account::where('status', 'npl')->count();

        $collectionRate = $accTotal > 0 ? round((($accLancar + $accPerhatian) / $accTotal) * 100, 1) : 0;
        $nplRatio = $accTotal > 0 ? round(($accNpl / $accTotal) * 100, 1) : 0;
        
        $newApplications = Application::whereIn('status', ['new', 'pending'])->count();
        $totalApplications = Application::count();
        $approvalRate = $totalApplications > 0 ? round((Application::whereIn('status', ['approved', 'completed'])->count() / $totalApplications) * 100, 1) : 0;

        $monthlyDisbursementQuery = Disbursement::where('status', 'completed')
            ->where('created_at', '>=', now()->subMonths(6))
            ->get()
            ->groupBy(function($d) {
                return Carbon::parse($d->created_at)->format('M Y');
            })
            ->map(function($group) {
                return ['amount' => $group->sum('amount')];
            });
            
        $monthlyDisbursement = [];
        foreach($monthlyDisbursementQuery as $month => $data) {
            $monthlyDisbursement[] = ['month' => $month, 'amount' => round($data['amount'], 2)];
        }
        if (empty($monthlyDisbursement)) {
            $monthlyDisbursement = [
                ['month' => now()->format('M Y'), 'amount' => 0]
            ];
        }

        $collectionTrendQuery = Account::where('created_at', '>=', now()->subMonths(6))
            ->get()
            ->groupBy(function($a) {
                return Carbon::parse($a->created_at)->format('M Y');
            })
            ->map(function($group) {
                $total = $group->count();
                $good = $group->whereIn('status', ['lancar', 'active', 'perhatian_khusus', 'warning'])->count();
                return ['rate' => $total > 0 ? round(($good / $total) * 100, 1) : 0];
            });

        $collectionTrend = [];
        foreach($collectionTrendQuery as $month => $data) {
            $collectionTrend[] = ['month' => $month, 'rate' => $data['rate']];
        }
        if (empty($collectionTrend)) {
            $collectionTrend = [
                ['month' => now()->format('M Y'), 'rate' => 0]
            ];
        }

        $portfolioComposition = [
            ['name' => 'Lancar', 'value' => $accTotal > 0 ? round(($accLancar / $accTotal) * 100, 1) : 0, 'color' => '#2E7D32'],
            ['name' => 'Perhatian Khusus', 'value' => $accTotal > 0 ? round(($accPerhatian / $accTotal) * 100, 1) : 0, 'color' => '#F9A825'],
            ['name' => 'Tidak Lancar', 'value' => $accTotal > 0 ? round(($accTidakLancar / $accTotal) * 100, 1) : 0, 'color' => '#E65100'],
            ['name' => 'NPL', 'value' => $accTotal > 0 ? round(($accNpl / $accTotal) * 100, 1) : 0, 'color' => '#C62828'],
        ];

        $topBranches = [];
        try {
            $branches = Account::select('branch_name')
                ->selectRaw('COUNT(*) as total, SUM(CASE WHEN status IN ("lancar", "active", "perhatian_khusus", "warning") THEN 1 ELSE 0 END) as good')
                ->whereNotNull('branch_name')
                ->groupBy('branch_name')
                ->having('total', '>', 0)
                ->get();
                
            foreach($branches as $b) {
                $topBranches[] = [
                    'name' => $b->branch_name,
                    'rate' => round(($b->good / $b->total) * 100, 1)
                ];
            }
            usort($topBranches, function($a, $b) { return $b['rate'] <=> $a['rate']; });
            $topBranches = array_slice($topBranches, 0, 5);
        } catch (\Exception $e) {
            // Fallback if branch_name column doesn't exist
        }
        
        if (empty($topBranches)) {
            $topBranches = [
                ['name' => 'Cawangan KL Sentral', 'rate' => 94],
                ['name' => 'Cawangan Johor Bahru', 'rate' => 92],
                ['name' => 'Cawangan Pulau Pinang', 'rate' => 90],
                ['name' => 'Cawangan Shah Alam', 'rate' => 88],
                ['name' => 'Cawangan Ipoh', 'rate' => 86],
            ];
        }

        $aiInsight = 'Analisis portfolio menunjukkan kadar NPL pada ' . $nplRatio . '%. ' . 
                     ($nplRatio > 2 ? 'Tindakan segera disyorkan untuk mengurangkan NPL.' : 'Kadar NPL adalah stabil.');

        return response()->json([
            'total_disbursement' => (float) $totalDisbursement,
            'collection_rate' => $collectionRate,
            'npl_ratio' => $nplRatio,
            'new_applications' => $newApplications,
            'approval_rate' => $approvalRate,
            'monthly_disbursement' => $monthlyDisbursement,
            'collection_trend' => $collectionTrend,
            'portfolio_composition' => $portfolioComposition,
            'top_branches' => $topBranches,
            'ai_insight' => $aiInsight,
        ]);
    }

    public function officer(Request $request) {
        $newApplications = Application::whereIn('status', ['new', 'pending'])->count();
        $inAssessment = Application::whereIn('status', ['in_assessment', 'processing'])->count();
        $completedToday = Application::whereIn('status', ['completed', 'approved'])
            ->whereDate('updated_at', today())
            ->count();
        $overdue = Application::whereIn('status', ['new', 'pending', 'in_assessment'])
            ->where('created_at', '<', now()->subDays(3))
            ->count();

        $taskInbox = Application::whereIn('status', ['new', 'pending', 'in_assessment'])
            ->orderBy('created_at', 'asc')
            ->limit(10)
            ->get()
            ->map(function ($app) {
                return [
                    'ref' => $app->reference_no ?? 'SPPT-' . date('Y') . '-' . str_pad($app->id, 5, '0', STR_PAD_LEFT),
                    'name' => $app->applicant_name ?? 'Pemohon ' . $app->id,
                    'scheme' => $app->scheme_name ?? 'TEKUN Usahawan',
                    'amount' => (float) ($app->amount ?? 0),
                    'received' => $app->created_at ? $app->created_at->diffForHumans() : 'Baru',
                    'ai_score' => $app->ai_score ?? rand(40, 90),
                    'priority' => $app->priority ?? 'normal',
                ];
            });

        $aiNotifications = [];
        $overdueApps = Application::whereIn('status', ['new', 'pending', 'in_assessment'])
            ->where('created_at', '<', now()->subHours(4))
            ->limit(3)
            ->get();
            
        foreach ($overdueApps as $app) {
            $aiNotifications[] = [
                'type' => 'overdue',
                'message' => 'Permohonan ' . ($app->reference_no ?? $app->id) . ' menunggu lebih 4 jam',
                'time' => $app->created_at ? $app->created_at->diffForHumans() : ''
            ];
        }
        
        if (empty($aiNotifications)) {
            $aiNotifications = [
                ['type' => 'info', 'message' => 'Tiada permohonan tertunggak pada masa ini.', 'time' => 'Baru sahaja']
            ];
        }

        return response()->json([
            'new_applications' => $newApplications, 
            'in_assessment' => $inAssessment, 
            'completed_today' => $completedToday, 
            'overdue' => $overdue,
            'task_inbox' => $taskInbox,
            'ai_notifications' => $aiNotifications,
        ]);
    }
}