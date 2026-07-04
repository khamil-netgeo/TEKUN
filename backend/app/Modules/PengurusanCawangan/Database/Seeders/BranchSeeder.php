<?php

namespace App\Modules\PengurusanCawangan\Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Branch;
use App\Models\BranchPerformance;

class BranchSeeder extends Seeder
{
    public function run(): void
    {
        $branches = [
            ['code' => 'KL01', 'name' => 'Cawangan KL Sentral',      'state' => 'WP Kuala Lumpur',   'district' => 'Brickfields',    'manager_name' => 'Encik Hafiz Razali',    'collection_rate' => 94.2, 'npl_ratio' => 1.1, 'staff_count' => 12, 'monthly_target' => 500000, 'monthly_actual' => 487000],
            ['code' => 'KL02', 'name' => 'Cawangan Chow Kit',         'state' => 'WP Kuala Lumpur',   'district' => 'Chow Kit',       'manager_name' => 'Puan Siti Hajar',       'collection_rate' => 89.5, 'npl_ratio' => 1.8, 'staff_count' => 10, 'monthly_target' => 420000, 'monthly_actual' => 376000],
            ['code' => 'SL01', 'name' => 'Cawangan Shah Alam',        'state' => 'Selangor',          'district' => 'Shah Alam',      'manager_name' => 'Encik Azlan Mokhtar',   'collection_rate' => 91.3, 'npl_ratio' => 1.5, 'staff_count' => 9,  'monthly_target' => 380000, 'monthly_actual' => 347000],
            ['code' => 'SL02', 'name' => 'Cawangan Klang',            'state' => 'Selangor',          'district' => 'Klang',          'manager_name' => 'Puan Rohani Ismail',    'collection_rate' => 87.0, 'npl_ratio' => 2.3, 'staff_count' => 8,  'monthly_target' => 350000, 'monthly_actual' => 304500],
            ['code' => 'JH01', 'name' => 'Cawangan Johor Bahru',      'state' => 'Johor',             'district' => 'Johor Bahru',    'manager_name' => 'Encik Farid Osman',     'collection_rate' => 92.8, 'npl_ratio' => 1.3, 'staff_count' => 11, 'monthly_target' => 460000, 'monthly_actual' => 426000],
            ['code' => 'JH02', 'name' => 'Cawangan Batu Pahat',       'state' => 'Johor',             'district' => 'Batu Pahat',     'manager_name' => 'Puan Norliza Ahmad',    'collection_rate' => 85.5, 'npl_ratio' => 2.8, 'staff_count' => 7,  'monthly_target' => 280000, 'monthly_actual' => 239400],
            ['code' => 'PN01', 'name' => 'Cawangan Pulau Pinang',     'state' => 'Pulau Pinang',      'district' => 'Georgetown',     'manager_name' => 'Encik Khairul Anwar',   'collection_rate' => 90.1, 'npl_ratio' => 1.6, 'staff_count' => 8,  'monthly_target' => 340000, 'monthly_actual' => 306000],
            ['code' => 'KD01', 'name' => 'Cawangan Alor Setar',       'state' => 'Kedah',             'district' => 'Alor Setar',     'manager_name' => 'Puan Hasmah Daud',      'collection_rate' => 88.7, 'npl_ratio' => 2.0, 'staff_count' => 8,  'monthly_target' => 300000, 'monthly_actual' => 266000],
            ['code' => 'KL03', 'name' => 'Cawangan Kelantan',         'state' => 'Kelantan',          'district' => 'Kota Bharu',     'manager_name' => 'Encik Zulkifli Yusof',  'collection_rate' => 83.2, 'npl_ratio' => 3.1, 'staff_count' => 9,  'monthly_target' => 320000, 'monthly_actual' => 266000],
            ['code' => 'TR01', 'name' => 'Cawangan Kuala Terengganu', 'state' => 'Terengganu',        'district' => 'Kuala Terengganu','manager_name' => 'Puan Suraya Hamid',    'collection_rate' => 86.4, 'npl_ratio' => 2.4, 'staff_count' => 7,  'monthly_target' => 270000, 'monthly_actual' => 233000],
            ['code' => 'PH01', 'name' => 'Cawangan Kuantan',          'state' => 'Pahang',            'district' => 'Kuantan',        'manager_name' => 'Encik Roslan Bakar',    'collection_rate' => 89.0, 'npl_ratio' => 1.9, 'staff_count' => 8,  'monthly_target' => 310000, 'monthly_actual' => 276000],
            ['code' => 'NS01', 'name' => 'Cawangan Seremban',         'state' => 'Negeri Sembilan',   'district' => 'Seremban',       'manager_name' => 'Puan Kalsom Mansor',    'collection_rate' => 91.8, 'npl_ratio' => 1.4, 'staff_count' => 8,  'monthly_target' => 330000, 'monthly_actual' => 303000],
            ['code' => 'ML01', 'name' => 'Cawangan Melaka',           'state' => 'Melaka',            'district' => 'Melaka Tengah',  'manager_name' => 'Encik Shamsul Bahri',   'collection_rate' => 93.5, 'npl_ratio' => 1.2, 'staff_count' => 9,  'monthly_target' => 360000, 'monthly_actual' => 336600],
            ['code' => 'PK01', 'name' => 'Cawangan Ipoh',             'state' => 'Perak',             'district' => 'Ipoh',           'manager_name' => 'Puan Roslina Ghani',    'collection_rate' => 88.2, 'npl_ratio' => 2.1, 'staff_count' => 9,  'monthly_target' => 350000, 'monthly_actual' => 309000],
            ['code' => 'SB01', 'name' => 'Cawangan Kota Kinabalu',    'state' => 'Sabah',             'district' => 'Kota Kinabalu',  'manager_name' => 'Encik Mohd Fadzil',     'collection_rate' => 87.5, 'npl_ratio' => 2.2, 'staff_count' => 10, 'monthly_target' => 390000, 'monthly_actual' => 341000],
            ['code' => 'SK01', 'name' => 'Cawangan Kuching',          'state' => 'Sarawak',           'district' => 'Kuching',        'manager_name' => 'Puan Norzaharah Salleh','collection_rate' => 90.6, 'npl_ratio' => 1.7, 'staff_count' => 10, 'monthly_target' => 400000, 'monthly_actual' => 362000],
        ];

        foreach ($branches as $i => $data) {
            $branch = Branch::updateOrCreate(['code' => $data['code']], array_merge($data, [
                'address'      => 'No. ' . rand(1, 99) . ', Jalan ' . $data['district'] . ', ' . $data['state'],
                'phone'        => '03-' . rand(2000, 9999) . rand(1000, 9999),
                'email'        => strtolower(str_replace(' ', '', $data['code'])) . '@tekun.gov.my',
                'manager_email'=> strtolower(str_replace(' ', ' ', $data['manager_name'])) . '@tekun.gov.my',
                'is_active'    => true,
                'total_applications' => rand(80, 200),
                'active_accounts'    => rand(50, 150),
                'disbursement_amount'=> rand(500000, 2000000),
                'performance_rank'   => $i + 1,
            ]));

            // Seed 6 months of performance history
            for ($m = 5; $m >= 0; $m--) {
                $period = now()->subMonths($m)->format('Y-m');
                $target = $data['monthly_target'];
                $variance = rand(-15, 15) / 100;
                $actual = round($target * (1 + $variance), 2);

                BranchPerformance::updateOrCreate(
                    ['branch_id' => $branch->id, 'period' => $period],
                    [
                        'target_amount'         => $target,
                        'actual_amount'         => $actual,
                        'collection_rate'       => $data['collection_rate'] + rand(-5, 5) / 10,
                        'npl_ratio'             => max(0.5, $data['npl_ratio'] + rand(-3, 3) / 10),
                        'new_applications'      => rand(10, 40),
                        'approved_applications' => rand(8, 30),
                        'rejected_applications' => rand(1, 5),
                        'performance_rank'      => $m === 0 ? ($branch->performance_rank) : rand(1, 16),
                    ]
                );
            }
        }

        $this->command->info('✅ 16 branches + 6 months performance history seeded.');
    }
}
