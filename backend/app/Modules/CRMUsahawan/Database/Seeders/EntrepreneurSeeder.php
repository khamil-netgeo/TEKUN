<?php

namespace App\Modules\CRMUsahawan\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Module 7 — CRM & Pemantauan Usahawan
 * EntrepreneurSeeder — seeds 10 demo entrepreneurs with KPI snapshots and visits
 */
class EntrepreneurSeeder extends Seeder
{
    public function run(): void
    {
        $branchId  = DB::table('branches')->value('id') ?? 1;
        $officerId = DB::table('users')->where('email', 'pegawai@tekun.gov.my')->value('id') ?? 1;

        $entrepreneurs = [
            [
                'ref_no'              => 'USH-0001',
                'name'                => 'Ahmad Bin Mohd Ali',
                'ic_no'               => '850101141234',
                'phone'               => '0123456789',
                'email'               => 'ahmad@example.com',
                'state'               => 'Kuala Lumpur',
                'district'            => 'Chow Kit',
                'race'                => 'Melayu',
                'gender'              => 'Lelaki',
                'dob'                 => '1985-01-01',
                'business_name'       => 'Warung Ahmad Maju',
                'business_reg_no'     => 'SA0012345',
                'sector'              => 'Makanan & Minuman',
                'business_type'       => 'Milikan Tunggal',
                'business_start_date' => '2018-03-15',
                'skim'                => 'TEKUN Usahawan',
                'total_financing'     => 50000.00,
                'outstanding_balance' => 30000.00,
                'financing_status'    => 'Lancar',
                'branch_id'           => $branchId,
                'assigned_officer_id' => $officerId,
                'monthly_revenue'     => 12500.00,
                'monthly_expenses'    => 8000.00,
                'employee_count'      => 4,
                'monthly_sales'       => 28000.00,
                'health_score'        => 82,
                'distress_level'      => 'Rendah',
                'default_probability' => 0.0800,
                'ai_factors'          => json_encode([]),
                'status'              => 'aktif',
            ],
            [
                'ref_no'              => 'USH-0002',
                'name'                => 'Siti Noraini Binti Hassan',
                'ic_no'               => '870512035678',
                'phone'               => '0134567890',
                'email'               => 'siti@example.com',
                'state'               => 'Selangor',
                'district'            => 'Shah Alam',
                'race'                => 'Melayu',
                'gender'              => 'Perempuan',
                'dob'                 => '1987-05-12',
                'business_name'       => 'Butik Siti Exclusive',
                'business_reg_no'     => 'SA0023456',
                'sector'              => 'Fesyen',
                'business_type'       => 'Milikan Tunggal',
                'business_start_date' => '2020-06-01',
                'skim'                => 'TEKUN Wanita',
                'total_financing'     => 30000.00,
                'outstanding_balance' => 22000.00,
                'financing_status'    => 'Perhatian Khusus',
                'branch_id'           => $branchId,
                'assigned_officer_id' => $officerId,
                'monthly_revenue'     => 5500.00,
                'monthly_expenses'    => 5200.00,
                'employee_count'      => 2,
                'monthly_sales'       => 8000.00,
                'health_score'        => 61,
                'distress_level'      => 'Sederhana',
                'default_probability' => 0.2200,
                'ai_factors'          => json_encode(['margin_rendah', 'status_pembiayaan_perhatian_khusus']),
                'status'              => 'aktif',
            ],
            [
                'ref_no'              => 'USH-0003',
                'name'                => 'Tan Wei Ming',
                'ic_no'               => '900305145678',
                'phone'               => '0167891234',
                'email'               => 'tanwm@example.com',
                'state'               => 'Johor',
                'district'            => 'Johor Bahru',
                'race'                => 'Cina',
                'gender'              => 'Lelaki',
                'dob'                 => '1990-03-05',
                'business_name'       => 'TechFix Solutions',
                'business_reg_no'     => 'JB0034567',
                'sector'              => 'Teknologi',
                'business_type'       => 'Milikan Tunggal',
                'business_start_date' => '2022-01-10',
                'skim'                => 'TEKUN Usahawan',
                'total_financing'     => 75000.00,
                'outstanding_balance' => 68000.00,
                'financing_status'    => 'Tidak Lancar',
                'branch_id'           => $branchId,
                'assigned_officer_id' => $officerId,
                'monthly_revenue'     => 3200.00,
                'monthly_expenses'    => 4100.00,
                'employee_count'      => 1,
                'monthly_sales'       => 4500.00,
                'health_score'        => 38,
                'distress_level'      => 'Tinggi',
                'default_probability' => 0.5500,
                'ai_factors'          => json_encode(['margin_negatif', 'status_pembiayaan_tidak_lancar', 'baki_tinggi']),
                'status'              => 'aktif',
            ],
            [
                'ref_no'              => 'USH-0004',
                'name'                => 'Nurul Ain Binti Razali',
                'ic_no'               => '920814086789',
                'phone'               => '0112345678',
                'email'               => 'nurulain@example.com',
                'state'               => 'Pulau Pinang',
                'district'            => 'Georgetown',
                'race'                => 'Melayu',
                'gender'              => 'Perempuan',
                'dob'                 => '1992-08-14',
                'business_name'       => 'Ain Craft Studio',
                'business_reg_no'     => 'PP0045678',
                'sector'              => 'Kraftangan',
                'business_type'       => 'Milikan Tunggal',
                'business_start_date' => '2019-09-20',
                'skim'                => 'TEKUN Wanita',
                'total_financing'     => 20000.00,
                'outstanding_balance' => 8000.00,
                'financing_status'    => 'Lancar',
                'branch_id'           => $branchId,
                'assigned_officer_id' => $officerId,
                'monthly_revenue'     => 7800.00,
                'monthly_expenses'    => 4200.00,
                'employee_count'      => 3,
                'monthly_sales'       => 12000.00,
                'health_score'        => 88,
                'distress_level'      => 'Rendah',
                'default_probability' => 0.0500,
                'ai_factors'          => json_encode([]),
                'status'              => 'aktif',
            ],
            [
                'ref_no'              => 'USH-0005',
                'name'                => 'Mohd Hafiz Bin Ramli',
                'ic_no'               => '880620071234',
                'phone'               => '0198765432',
                'email'               => 'hafiz@example.com',
                'state'               => 'Perak',
                'district'            => 'Ipoh',
                'race'                => 'Melayu',
                'gender'              => 'Lelaki',
                'dob'                 => '1988-06-20',
                'business_name'       => 'Hafiz Auto Servis',
                'business_reg_no'     => 'PK0056789',
                'sector'              => 'Automotif',
                'business_type'       => 'Perkongsian',
                'business_start_date' => '2016-04-01',
                'skim'                => 'TEKUN Usahawan',
                'total_financing'     => 40000.00,
                'outstanding_balance' => 15000.00,
                'financing_status'    => 'Lancar',
                'branch_id'           => $branchId,
                'assigned_officer_id' => $officerId,
                'monthly_revenue'     => 18000.00,
                'monthly_expenses'    => 11000.00,
                'employee_count'      => 6,
                'monthly_sales'       => 35000.00,
                'health_score'        => 91,
                'distress_level'      => 'Rendah',
                'default_probability' => 0.0300,
                'ai_factors'          => json_encode([]),
                'status'              => 'aktif',
            ],
        ];

        foreach ($entrepreneurs as $data) {
            $data['created_at'] = now();
            $data['updated_at'] = now();
            $data['ai_score_updated_at'] = now();
            $data['kpi_updated_at'] = now()->toDateTimeString();

            $id = DB::table('entrepreneurs')->insertGetId($data);

            // Seed 6 months of KPI snapshots
            for ($i = 5; $i >= 0; $i--) {
                $period  = now()->subMonths($i)->format('Y-m');
                $revenue = $data['monthly_revenue'] * (0.85 + (rand(0, 30) / 100));
                $expenses = $data['monthly_expenses'] * (0.9 + (rand(0, 20) / 100));
                DB::table('entrepreneur_kpi_snapshots')->insert([
                    'entrepreneur_id' => $id,
                    'period'          => $period,
                    'revenue'         => round($revenue, 2),
                    'expenses'        => round($expenses, 2),
                    'profit'          => round($revenue - $expenses, 2),
                    'employee_count'  => $data['employee_count'],
                    'sales_volume'    => round($revenue * 2.2, 2),
                    'source'          => 'system',
                    'created_at'      => now(),
                    'updated_at'      => now(),
                ]);
            }

            // Seed 2 field visits per entrepreneur (insert separately to avoid column mismatch)
            DB::table('field_visits')->insert([
                'ref_no'             => 'LW-' . str_pad($id * 2 - 1, 4, '0', STR_PAD_LEFT),
                'entrepreneur_id'    => $id,
                'officer_id'         => $officerId,
                'branch_id'          => $branchId,
                'scheduled_date'     => now()->subDays(30)->toDateString(),
                'scheduled_time'     => '10:00:00',
                'purpose'            => 'Pemantauan Perniagaan',
                'status'             => 'Selesai',
                'actual_date'        => now()->subDays(30)->toDateString(),
                'business_condition' => $data['health_score'] >= 70 ? 'Baik' : ($data['health_score'] >= 50 ? 'Sederhana' : 'Lemah'),
                'visit_notes'        => 'Lawatan pemantauan rutin. Usahawan hadir dan perniagaan beroperasi.',
                'created_at'         => now(),
                'updated_at'         => now(),
            ]);
            DB::table('field_visits')->insert([
                'ref_no'          => 'LW-' . str_pad($id * 2, 4, '0', STR_PAD_LEFT),
                'entrepreneur_id' => $id,
                'officer_id'      => $officerId,
                'branch_id'       => $branchId,
                'scheduled_date'  => now()->addDays(14)->toDateString(),
                'scheduled_time'  => '14:00:00',
                'purpose'         => 'Tindakan Susulan',
                'status'          => 'Dijadualkan',
                'created_at'      => now(),
                'updated_at'      => now(),
            ]);
        }

        $this->command->info('EntrepreneurSeeder: 5 entrepreneurs + KPI snapshots + field visits seeded.');
    }
}
