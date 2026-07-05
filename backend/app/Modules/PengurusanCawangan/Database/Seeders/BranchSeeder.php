<?php

namespace App\Modules\PengurusanCawangan\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Branch;
use App\Models\BranchPerformance;

/**
 * TEKUN SPPT — Module 8: Pengurusan Cawangan
 * Seeds 16 realistic Malaysian branches with 6 months performance history.
 */
class BranchSeeder extends Seeder
{
    public function run(): void
    {
        $branches = [
            ['code' => 'KL01', 'name' => 'Cawangan KL Sentral',        'state' => 'WP Kuala Lumpur',   'district' => 'Brickfields',    'npl_ratio' => 3.2,  'collection_rate' => 96.8, 'staff_count' => 12, 'performance_rank' => 1],
            ['code' => 'KL02', 'name' => 'Cawangan Chow Kit',           'state' => 'WP Kuala Lumpur',   'district' => 'Chow Kit',       'npl_ratio' => 4.1,  'collection_rate' => 95.2, 'staff_count' => 10, 'performance_rank' => 3],
            ['code' => 'SL01', 'name' => 'Cawangan Shah Alam',          'state' => 'Selangor',          'district' => 'Shah Alam',      'npl_ratio' => 3.8,  'collection_rate' => 95.9, 'staff_count' => 11, 'performance_rank' => 2],
            ['code' => 'SL02', 'name' => 'Cawangan Klang',              'state' => 'Selangor',          'district' => 'Klang',          'npl_ratio' => 5.2,  'collection_rate' => 93.1, 'staff_count' => 9,  'performance_rank' => 7],
            ['code' => 'JH01', 'name' => 'Cawangan Johor Bahru',        'state' => 'Johor',             'district' => 'Johor Bahru',    'npl_ratio' => 4.5,  'collection_rate' => 94.5, 'staff_count' => 10, 'performance_rank' => 5],
            ['code' => 'JH02', 'name' => 'Cawangan Batu Pahat',         'state' => 'Johor',             'district' => 'Batu Pahat',     'npl_ratio' => 5.8,  'collection_rate' => 92.3, 'staff_count' => 8,  'performance_rank' => 10],
            ['code' => 'PN01', 'name' => 'Cawangan Georgetown',         'state' => 'Pulau Pinang',      'district' => 'Timur Laut',     'npl_ratio' => 4.2,  'collection_rate' => 95.1, 'staff_count' => 11, 'performance_rank' => 4],
            ['code' => 'KD01', 'name' => 'Cawangan Alor Setar',         'state' => 'Kedah',             'district' => 'Kota Setar',     'npl_ratio' => 5.5,  'collection_rate' => 92.8, 'staff_count' => 9,  'performance_rank' => 9],
            ['code' => 'KL03', 'name' => 'Cawangan Kelantan',           'state' => 'Kelantan',          'district' => 'Kota Bharu',     'npl_ratio' => 6.1,  'collection_rate' => 91.5, 'staff_count' => 8,  'performance_rank' => 13],
            ['code' => 'TR01', 'name' => 'Cawangan Kuala Terengganu',   'state' => 'Terengganu',        'district' => 'Kuala Terengganu','npl_ratio' => 5.9,  'collection_rate' => 92.0, 'staff_count' => 8,  'performance_rank' => 11],
            ['code' => 'PH01', 'name' => 'Cawangan Kuantan',            'state' => 'Pahang',            'district' => 'Kuantan',        'npl_ratio' => 5.3,  'collection_rate' => 93.5, 'staff_count' => 9,  'performance_rank' => 8],
            ['code' => 'NS01', 'name' => 'Cawangan Seremban',           'state' => 'Negeri Sembilan',   'district' => 'Seremban',       'npl_ratio' => 4.7,  'collection_rate' => 94.2, 'staff_count' => 9,  'performance_rank' => 6],
            ['code' => 'ML01', 'name' => 'Cawangan Melaka',             'state' => 'Melaka',            'district' => 'Melaka Tengah',  'npl_ratio' => 4.9,  'collection_rate' => 93.8, 'staff_count' => 9,  'performance_rank' => 7],
            ['code' => 'PK01', 'name' => 'Cawangan Ipoh',               'state' => 'Perak',             'district' => 'Kinta',          'npl_ratio' => 5.1,  'collection_rate' => 93.3, 'staff_count' => 10, 'performance_rank' => 8],
            ['code' => 'SW01', 'name' => 'Cawangan Kuching',            'state' => 'Sarawak',           'district' => 'Kuching',        'npl_ratio' => 6.3,  'collection_rate' => 91.2, 'staff_count' => 8,  'performance_rank' => 14],
            ['code' => 'SB01', 'name' => 'Cawangan Kota Kinabalu',      'state' => 'Sabah',             'district' => 'Kota Kinabalu',  'npl_ratio' => 6.8,  'collection_rate' => 90.5, 'staff_count' => 7,  'performance_rank' => 16],
        ];

        foreach ($branches as $data) {
            $branch = Branch::updateOrCreate(
                ['code' => $data['code']],
                [
                    'name'               => $data['name'],
                    'state'              => $data['state'],
                    'district'           => $data['district'],
                    'address'            => 'Alamat Ujian, ' . $data['district'] . ', ' . $data['state'],
                    'phone'              => '03-' . rand(10000000, 99999999),
                    'email'              => strtolower($data['code']) . '@tekun.gov.my',
                    'npl_ratio'          => $data['npl_ratio'],
                    'collection_rate'    => $data['collection_rate'],
                    'staff_count'        => $data['staff_count'],
                    'performance_rank'   => $data['performance_rank'],
                    'target_collection_rate' => 95.00,
                    'monthly_target'     => 500000,
                    'monthly_actual'     => 500000 * ($data['collection_rate'] / 100),
                    'is_active'          => true,
                ]
            );

            // Seed 6 months of performance history
            $months = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];
            foreach ($months as $idx => $period) {
                $variation = (rand(-20, 20) / 10);
                BranchPerformance::updateOrCreate(
                    ['branch_id' => $branch->id, 'period' => $period],
                    [
                        'collection_rate'        => max(85, min(99, $data['collection_rate'] + $variation)),
                        'npl_ratio'              => max(1, min(12, $data['npl_ratio'] + ($variation / 2))),
                        'disbursement_amount'    => rand(200000, 800000),
                        'applications_received'  => rand(20, 80),
                        'applications_approved'  => rand(15, 60),
                        'applications_rejected'  => rand(2, 10),
                        'target_collection_rate' => 95.00,
                        'target_disbursement'    => 500000,
                        'performance_rank'       => $data['performance_rank'],
                    ]
                );
            }
        }

        $this->command->info('BranchSeeder: 16 branches + 6 months performance history seeded.');
    }
}
