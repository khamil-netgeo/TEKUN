<?php

namespace App\Modules\PengurusanAkaun\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Module 4 — Demo Account Seeder
 * Seeds demo financing accounts for POC demonstration.
 */
class AccountSeeder extends Seeder
{
    public function run(): void
    {
        // Only seed if accounts table is empty
        if (DB::table('accounts')->count() > 0) {
            $this->command->info('Accounts table already has data. Skipping seeder.');
            return;
        }

        $accounts = [
            [
                'account_no'          => 'TEKUN-2026-00089',
                'ic_no'               => '880101145678',
                'borrower_name'       => 'Siti Nurhaliza binti Ahmad',
                'principal'           => 50000.00,
                'profit_rate'         => 8.00,
                'tenure_months'       => 84,
                'monthly_instalment'  => 763.89,
                'start_date'          => '2026-05-01',
                'maturity_date'       => '2033-05-01',
                'outstanding_balance' => 23456.78,
                'total_paid'          => 2291.67,
                'arrears_amount'      => 0.00,
                'arrears_days'        => 0,
                'classification'      => 'lancar',
                'tawidh_amount'       => 0.00,
                'moratorium_active'   => false,
                'status'              => 'active',
                'created_at'          => now(),
                'updated_at'          => now(),
            ],
            [
                'account_no'          => 'TEKUN-2026-00090',
                'ic_no'               => '900215085432',
                'borrower_name'       => 'Ahmad Razif bin Mohd Noor',
                'principal'           => 20000.00,
                'profit_rate'         => 7.00,
                'tenure_months'       => 60,
                'monthly_instalment'  => 396.02,
                'start_date'          => '2026-03-01',
                'maturity_date'       => '2031-03-01',
                'outstanding_balance' => 18500.00,
                'total_paid'          => 1500.00,
                'arrears_amount'      => 0.00,
                'arrears_days'        => 0,
                'classification'      => 'lancar',
                'tawidh_amount'       => 0.00,
                'moratorium_active'   => false,
                'status'              => 'active',
                'created_at'          => now(),
                'updated_at'          => now(),
            ],
            [
                'account_no'          => 'TEKUN-2026-00091',
                'ic_no'               => '750520076543',
                'borrower_name'       => 'Noraini binti Hassan',
                'principal'           => 30000.00,
                'profit_rate'         => 8.00,
                'tenure_months'       => 72,
                'monthly_instalment'  => 527.23,
                'start_date'          => '2025-10-01',
                'maturity_date'       => '2031-10-01',
                'outstanding_balance' => 27500.00,
                'total_paid'          => 2500.00,
                'arrears_amount'      => 1054.46,
                'arrears_days'        => 62,
                'classification'      => 'perhatian_khusus',
                'tawidh_amount'       => 17.89,
                'moratorium_active'   => false,
                'status'              => 'active',
                'created_at'          => now(),
                'updated_at'          => now(),
            ],
        ];

        DB::table('accounts')->insert($accounts);

        $this->command->info('✅ Module 4: 3 demo accounts seeded.');
    }
}
