<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Account;
use App\Models\Disbursement;
use Illuminate\Http\Request;

class DashboardController extends Controller {
    public function stats(Request $request) {
        return response()->json([
            'applications' => ['total' => 1247, 'new' => 8, 'in_assessment' => 12, 'completed' => 5, 'overdue' => 3],
            'disbursements' => ['pending' => 15, 'completed_today' => 7, 'total_amount' => 4200000],
            'accounts' => ['total' => 1369, 'lancar' => 1234, 'perhatian_khusus' => 89, 'tidak_lancar' => 34, 'npl' => 12],
            'collection_rate' => 89.4,
            'npl_ratio' => 1.8,
        ]);
    }
    public function executive(Request $request) {
        return response()->json([
            'total_disbursement' => 4200000000,
            'collection_rate' => 89.4,
            'npl_ratio' => 1.8,
            'new_applications' => 1247,
            'approval_rate' => 73.2,
            'monthly_disbursement' => [
                ['month' => 'Jan 2026', 'amount' => 280], ['month' => 'Feb 2026', 'amount' => 320],
                ['month' => 'Mac 2026', 'amount' => 310], ['month' => 'Apr 2026', 'amount' => 350],
                ['month' => 'Mei 2026', 'amount' => 370], ['month' => 'Jun 2026', 'amount' => 390],
                ['month' => 'Jul 2026', 'amount' => 420],
            ],
            'collection_trend' => [
                ['month' => 'Jan 2026', 'rate' => 74.0], ['month' => 'Feb 2026', 'rate' => 75.6],
                ['month' => 'Mac 2026', 'rate' => 77.2], ['month' => 'Apr 2026', 'rate' => 79.3],
                ['month' => 'Mei 2026', 'rate' => 81.2], ['month' => 'Jun 2026', 'rate' => 87.3],
                ['month' => 'Jul 2026', 'rate' => 89.4],
            ],
            'portfolio_composition' => [
                ['name' => 'Lancar', 'value' => 92.3, 'color' => '#2E7D32'],
                ['name' => 'Perhatian Khusus', 'value' => 5.6, 'color' => '#F9A825'],
                ['name' => 'Tidak Lancar', 'value' => 1.7, 'color' => '#E65100'],
                ['name' => 'NPL', 'value' => 0.4, 'color' => '#C62828'],
            ],
            'top_branches' => [
                ['name' => 'Cawangan KL Sentral', 'rate' => 94],
                ['name' => 'Cawangan Johor Bahru', 'rate' => 92],
                ['name' => 'Cawangan Pulau Pinang', 'rate' => 90],
                ['name' => 'Cawangan Shah Alam', 'rate' => 88],
                ['name' => 'Cawangan Ipoh', 'rate' => 86],
            ],
            'ai_insight' => 'Cawangan Kelantan menunjukkan peningkatan NPL 0.8% dalam 30 hari. Tindakan segera disyorkan.',
        ]);
    }
    public function officer(Request $request) {
        return response()->json([
            'new_applications' => 8, 'in_assessment' => 12, 'completed_today' => 5, 'overdue' => 3,
            'task_inbox' => [
                ['ref' => 'SPPT-2026-07-00089', 'name' => 'Siti Nurhaliza', 'scheme' => 'TEKUN Usahawan', 'amount' => 25000, 'received' => '2 jam lalu', 'ai_score' => 78, 'priority' => 'kritikal'],
                ['ref' => 'SPPT-2026-07-00090', 'name' => 'Ahmad Faizal', 'scheme' => 'TEKUN Micro', 'amount' => 8000, 'received' => '3 jam lalu', 'ai_score' => 52, 'priority' => 'tinggi'],
                ['ref' => 'SPPT-2026-07-00091', 'name' => 'Nor Aisyah', 'scheme' => 'TEKUN Wanita', 'amount' => 15000, 'received' => '4 jam lalu', 'ai_score' => 48, 'priority' => 'sederhana'],
                ['ref' => 'SPPT-2026-07-00092', 'name' => 'Muhammad Hafiz', 'scheme' => 'TEKUN Micro', 'amount' => 12000, 'received' => '5 jam lalu', 'ai_score' => 66, 'priority' => 'sederhana'],
                ['ref' => 'SPPT-2026-07-00093', 'name' => 'Intan Puspita', 'scheme' => 'TEKUN Usahawan', 'amount' => 30000, 'received' => '6 jam lalu', 'ai_score' => 72, 'priority' => 'normal'],
                ['ref' => 'SPPT-2026-07-00094', 'name' => 'Raja Imran', 'scheme' => 'TEKUN Micro', 'amount' => 6000, 'received' => '7 jam lalu', 'ai_score' => 45, 'priority' => 'normal'],
                ['ref' => 'SPPT-2026-07-00095', 'name' => 'Farah Ayuni', 'scheme' => 'TEKUN Wanita', 'amount' => 10000, 'received' => '8 jam lalu', 'ai_score' => 61, 'priority' => 'rendah'],
                ['ref' => 'SPPT-2026-07-00096', 'name' => 'Azlan Shah', 'scheme' => 'TEKUN Usahawan', 'amount' => 18000, 'received' => '9 jam lalu', 'ai_score' => 70, 'priority' => 'rendah'],
            ],
            'ai_notifications' => [
                ['type' => 'overdue', 'message' => 'Permohonan SPPT-00089 menunggu >4 jam', 'time' => '2 jam lalu'],
                ['type' => 'warning', 'message' => 'Skor kredit borderline: SPPT-00090 perlu semakan manual', 'time' => '3 jam lalu'],
                ['type' => 'document', 'message' => 'Dokumen tidak lengkap: SPPT-00091', 'time' => '4 jam lalu'],
            ],
        ]);
    }
}