<?php

namespace App\Modules\LaporanAnalitik\Database\Seeders;

use App\Modules\LaporanAnalitik\Models\DashboardSnapshot;
use Illuminate\Database\Seeder;

class DashboardSnapshotSeeder extends Seeder
{
    public function run(): void
    {
        $months = [
            ['date' => '2026-01-31', 'portfolio' => 3_800_000_000, 'disbursement' => 280_000_000, 'approval' => 68.5, 'npl' => 2.8, 'collection' => 74.0, 'apps' => 980,  'approved' => 671,  'rejected' => 196, 'pending' => 113, 'accounts' => 1200],
            ['date' => '2026-02-28', 'portfolio' => 3_900_000_000, 'disbursement' => 320_000_000, 'approval' => 70.5, 'npl' => 2.6, 'collection' => 75.6, 'apps' => 1050, 'approved' => 740,  'rejected' => 210, 'pending' => 100, 'accounts' => 1230],
            ['date' => '2026-03-31', 'portfolio' => 3_980_000_000, 'disbursement' => 310_000_000, 'approval' => 71.4, 'npl' => 2.4, 'collection' => 77.2, 'apps' => 1120, 'approved' => 800,  'rejected' => 224, 'pending' => 96,  'accounts' => 1260],
            ['date' => '2026-04-30', 'portfolio' => 4_050_000_000, 'disbursement' => 350_000_000, 'approval' => 72.0, 'npl' => 2.2, 'collection' => 79.3, 'apps' => 1180, 'approved' => 850,  'rejected' => 236, 'pending' => 94,  'accounts' => 1290],
            ['date' => '2026-05-31', 'portfolio' => 4_100_000_000, 'disbursement' => 370_000_000, 'approval' => 72.7, 'npl' => 2.0, 'collection' => 81.2, 'apps' => 1210, 'approved' => 879,  'rejected' => 242, 'pending' => 89,  'accounts' => 1320],
            ['date' => '2026-06-30', 'portfolio' => 4_150_000_000, 'disbursement' => 390_000_000, 'approval' => 73.2, 'npl' => 1.9, 'collection' => 87.3, 'apps' => 1230, 'approved' => 900,  'rejected' => 246, 'pending' => 84,  'accounts' => 1350],
            ['date' => '2026-07-04', 'portfolio' => 4_200_000_000, 'disbursement' => 420_000_000, 'approval' => 73.2, 'npl' => 1.8, 'collection' => 89.4, 'apps' => 1247, 'approved' => 913,  'rejected' => 249, 'pending' => 85,  'accounts' => 1369],
        ];

        foreach ($months as $m) {
            DashboardSnapshot::updateOrCreate(
                ['snapshot_type' => 'monthly', 'snapshot_date' => $m['date']],
                [
                    'total_portfolio'      => $m['portfolio'],
                    'disbursement_volume'  => $m['disbursement'],
                    'approval_rate'        => $m['approval'],
                    'npl_ratio'            => $m['npl'],
                    'collection_rate'      => $m['collection'],
                    'total_applications'   => $m['apps'],
                    'approved_applications'=> $m['approved'],
                    'rejected_applications'=> $m['rejected'],
                    'pending_applications' => $m['pending'],
                    'active_accounts'      => $m['accounts'],
                ]
            );
        }

        $this->command->info('Dashboard snapshots seeded successfully.');
    }
}
