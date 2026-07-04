<?php

namespace App\Modules\PengurusanNPL\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Module 5 — Pengurusan NPL
 * Seeds demo accounts, npl_records, dunning_actions, and collection_tasks
 * for POC demonstration purposes.
 */
class NplSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure we have at least one application to reference
        $appId = DB::table('applications')->value('id');
        if (!$appId) {
            $branchId  = DB::table('branches')->value('id') ?? 1;
            $officerId = DB::table('users')->value('id') ?? 1;
            $appId = DB::table('applications')->insertGetId([
                'ref_no'          => 'NPL-DEMO-' . date('YmdHis'),
                'branch_id'       => $branchId,
                'officer_id'      => $officerId,
                'applicant_name'  => 'Demo Applicant',
                'ic_no'           => '800101015555',
                'phone'           => '0123456789',
                'scheme'          => 'Skim Usahawan',
                'amount_requested'=> 10000,
                'tenure_months'   => 60,
                'status'          => 'approved',
                'created_at'      => now(),
                'updated_at'      => now(),
            ]);
        }

        $userId = DB::table('users')->value('id') ?? 1;

        // ── Seed 30 demo accounts ─────────────────────────────────────────────
        $accounts = [
            // Lancar
            ['name' => 'Ahmad Bin Razak',      'ic' => '820315025001', 'days' => 0,   'class' => 'lancar',           'arrears' => 0,       'outstanding' => 8500.00],
            ['name' => 'Siti Binti Yusof',     'ic' => '790812085002', 'days' => 0,   'class' => 'lancar',           'arrears' => 0,       'outstanding' => 12000.00],
            ['name' => 'Mohd Faizal Bin Amin', 'ic' => '851120035003', 'days' => 0,   'class' => 'lancar',           'arrears' => 0,       'outstanding' => 5000.00],
            ['name' => 'Noraini Bt Hassan',    'ic' => '910505085004', 'days' => 0,   'class' => 'lancar',           'arrears' => 0,       'outstanding' => 9800.00],
            ['name' => 'Zulkifli Bin Omar',    'ic' => '780920015005', 'days' => 0,   'class' => 'lancar',           'arrears' => 0,       'outstanding' => 15000.00],
            // Perhatian Khusus (1-30 days)
            ['name' => 'Rosnah Bt Rahman',     'ic' => '830625085006', 'days' => 12,  'class' => 'perhatian_khusus', 'arrears' => 654.32,  'outstanding' => 7200.00],
            ['name' => 'Hafizi Bin Kamal',     'ic' => '870312015007', 'days' => 20,  'class' => 'perhatian_khusus', 'arrears' => 982.50,  'outstanding' => 11000.00],
            ['name' => 'Azizah Bt Ismail',     'ic' => '920808085008', 'days' => 28,  'class' => 'perhatian_khusus', 'arrears' => 1250.00, 'outstanding' => 6500.00],
            ['name' => 'Razif Bin Hamid',      'ic' => '800101015009', 'days' => 15,  'class' => 'perhatian_khusus', 'arrears' => 763.89,  'outstanding' => 8900.00],
            ['name' => 'Norzila Bt Ahmad',     'ic' => '750430085010', 'days' => 25,  'class' => 'perhatian_khusus', 'arrears' => 1100.00, 'outstanding' => 13500.00],
            // Tidak Lancar (31-90 days)
            ['name' => 'Faridah Bt Yusof',     'ic' => '810920085011', 'days' => 45,  'class' => 'tidak_lancar',     'arrears' => 1527.78, 'outstanding' => 9200.00],
            ['name' => 'Ahmad Faizal',          'ic' => '860714015012', 'days' => 60,  'class' => 'tidak_lancar',     'arrears' => 3450.00, 'outstanding' => 18000.00],
            ['name' => 'Mohd Azri Bin Salleh', 'ic' => '890225015013', 'days' => 75,  'class' => 'tidak_lancar',     'arrears' => 1875.20, 'outstanding' => 7800.00],
            ['name' => 'Suraya Bt Mohd',       'ic' => '930615085014', 'days' => 50,  'class' => 'tidak_lancar',     'arrears' => 2100.00, 'outstanding' => 14000.00],
            ['name' => 'Khairul Bin Anuar',    'ic' => '770808015015', 'days' => 85,  'class' => 'tidak_lancar',     'arrears' => 4200.00, 'outstanding' => 22000.00],
            // NPL Substandard (91-180 days)
            ['name' => 'Norhayati Bt Sulaiman','ic' => '840312085016', 'days' => 95,  'class' => 'npl_substandard',  'arrears' => 2291.67, 'outstanding' => 10500.00],
            ['name' => 'Zainal Bin Abidin',    'ic' => '760520015017', 'days' => 120, 'class' => 'npl_substandard',  'arrears' => 8900.00, 'outstanding' => 35000.00],
            ['name' => 'Halimah Bt Daud',      'ic' => '900115085018', 'days' => 150, 'class' => 'npl_substandard',  'arrears' => 5400.00, 'outstanding' => 19000.00],
            ['name' => 'Roslan Bin Mat',       'ic' => '820630015019', 'days' => 110, 'class' => 'npl_substandard',  'arrears' => 3800.00, 'outstanding' => 16500.00],
            // NPL Doubtful (181-365 days)
            ['name' => 'Siti Aisyah Bt Ismail','ic' => '880425085020', 'days' => 200, 'class' => 'npl_doubtful',     'arrears' => 9800.00, 'outstanding' => 28000.00],
            ['name' => 'Mohd Nizam Bin Razali','ic' => '730910015021', 'days' => 250, 'class' => 'npl_doubtful',     'arrears' => 12500.00,'outstanding' => 42000.00],
            ['name' => 'Normah Bt Othman',     'ic' => '860228085022', 'days' => 220, 'class' => 'npl_doubtful',     'arrears' => 7600.00, 'outstanding' => 24000.00],
            // NPL Loss (>365 days)
            ['name' => 'Kamaruddin Bin Idris', 'ic' => '710415015023', 'days' => 400, 'class' => 'npl_loss',         'arrears' => 18000.00,'outstanding' => 48000.00],
            ['name' => 'Rohani Bt Kassim',     'ic' => '790808085024', 'days' => 450, 'class' => 'npl_loss',         'arrears' => 22000.00,'outstanding' => 55000.00],
            ['name' => 'Azman Bin Yusof',      'ic' => '680520015025', 'days' => 380, 'class' => 'npl_loss',         'arrears' => 15000.00,'outstanding' => 38000.00],
        ];

        $accountIds = [];
        foreach ($accounts as $i => $acc) {
            $existing = DB::table('accounts')->where('ic_no', $acc['ic'])->value('id');
            if ($existing) {
                $accountIds[] = $existing;
                continue;
            }
            $principal = $acc['outstanding'] + ($acc['outstanding'] * 0.3);
            $id = DB::table('accounts')->insertGetId([
                'application_id'     => $appId,
                'account_no'         => 'SPPT-ACC-' . str_pad($i + 1, 5, '0', STR_PAD_LEFT),
                'ic_no'              => $acc['ic'],
                'borrower_name'      => $acc['name'],
                'principal'          => $principal,
                'profit_rate'        => 4.00,
                'tenure_months'      => 60,
                'monthly_instalment' => round($principal / 60, 2),
                'start_date'         => now()->subMonths(24)->toDateString(),
                'maturity_date'      => now()->addMonths(36)->toDateString(),
                'outstanding_balance'=> $acc['outstanding'],
                'total_paid'         => round($principal * 0.3, 2),
                'arrears_amount'     => $acc['arrears'],
                'arrears_days'       => $acc['days'],
                'classification'     => $acc['class'],
                'tawidh_amount'      => round($acc['arrears'] * 0.01 / 365 * $acc['days'], 2),
                'moratorium_active'  => false,
                'status'             => 'active',
                'created_at'         => now(),
                'updated_at'         => now(),
            ]);
            $accountIds[] = $id;
        }

        // ── Seed NPL Records ─────────────────────────────────────────────────
        $nplClassifications = ['npl_substandard', 'npl_doubtful', 'npl_loss', 'tidak_lancar'];
        foreach ($accountIds as $idx => $accId) {
            $acc = $accounts[$idx] ?? null;
            if (!$acc) continue;
            if (!in_array($acc['class'], $nplClassifications)) continue;

            $existing = DB::table('npl_records')->where('account_id', $accId)->exists();
            if ($existing) continue;

            $riskLevel = match(true) {
                $acc['days'] >= 365 => 'critical',
                $acc['days'] >= 180 => 'high',
                $acc['days'] >= 90  => 'medium',
                default             => 'low',
            };

            DB::table('npl_records')->insert([
                'account_id'               => $accId,
                'classification'           => $acc['class'],
                'days_overdue'             => $acc['days'],
                'outstanding'              => $acc['outstanding'],
                'ai_risk_level'            => $riskLevel,
                'ai_recovery_probability'  => match($riskLevel) {
                    'critical' => rand(5, 20),
                    'high'     => rand(20, 40),
                    'medium'   => rand(40, 65),
                    default    => rand(65, 85),
                },
                'ai_recommendation'        => match($riskLevel) {
                    'critical' => 'Rujuk kepada unit undang-undang untuk tindakan litigasi segera.',
                    'high'     => 'Hantar notis muktamad dan jadualkan lawatan lapangan.',
                    'medium'   => 'Hubungi peminjam melalui panggilan telefon dan tawarkan penstrukturan semula.',
                    default    => 'Hantar peringatan SMS dan e-mel. Pantau selama 30 hari.',
                },
                'classified_at'            => now()->subDays(rand(1, 7))->toDateString(),
                'created_at'               => now(),
                'updated_at'               => now(),
            ]);
        }

        // ── Seed Dunning Actions ─────────────────────────────────────────────
        $dunningAccounts = array_filter($accountIds, fn($id, $idx) =>
            isset($accounts[$idx]) && $accounts[$idx]['days'] > 30,
            ARRAY_FILTER_USE_BOTH
        );

        foreach ($dunningAccounts as $idx => $accId) {
            $acc = $accounts[$idx] ?? null;
            if (!$acc) continue;

            $existing = DB::table('dunning_actions')->where('account_id', $accId)->exists();
            if ($existing) continue;

            $actionType = match(true) {
                $acc['days'] > 180 => 'legal',
                $acc['days'] > 90  => 'notis3',
                $acc['days'] > 60  => 'notis2',
                default            => 'notis1',
            };

            DB::table('dunning_actions')->insert([
                'account_id'   => $accId,
                'action_type'  => $actionType,
                'channel'      => $acc['days'] > 90 ? 'post' : ($acc['days'] > 60 ? 'email' : 'sms'),
                'status'       => 'sent',
                'notes'        => 'Notis dihantar secara automatik oleh sistem.',
                'is_automated' => true,
                'actioned_by'  => $userId,
                'actioned_at'  => now()->subDays(rand(1, 5)),
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
        }

        // ── Seed Collection Tasks ────────────────────────────────────────────
        $taskAccounts = array_filter($accountIds, fn($id, $idx) =>
            isset($accounts[$idx]) && $accounts[$idx]['days'] > 0,
            ARRAY_FILTER_USE_BOTH
        );

        foreach ($taskAccounts as $idx => $accId) {
            $acc = $accounts[$idx] ?? null;
            if (!$acc) continue;

            $existing = DB::table('collection_tasks')->where('account_id', $accId)->exists();
            if ($existing) continue;

            $priority = match(true) {
                $acc['days'] >= 365 => rand(90, 100),
                $acc['days'] >= 180 => rand(75, 89),
                $acc['days'] >= 90  => rand(60, 74),
                $acc['days'] >= 30  => rand(40, 59),
                default             => rand(20, 39),
            };

            DB::table('collection_tasks')->insert([
                'account_id'            => $accId,
                'assigned_to'           => $userId,
                'status'                => 'pending',
                'priority_score'        => $priority,
                'ai_suggested_channel'  => $acc['days'] > 90 ? 'call' : 'sms',
                'ai_best_contact_time'  => $acc['days'] > 90 ? '10:00:00' : '14:00:00',
                'ai_recommendation'     => 'AI: Hubungi pada waktu pagi. Kemungkinan respons positif: ' . (100 - $priority) . '%.',
                'last_outcome'          => null,
                'attempt_count'         => rand(0, 3),
                'follow_up_at'          => now()->addDays(rand(1, 7)),
                'created_at'            => now(),
                'updated_at'            => now(),
            ]);
        }

        $this->command->info('✅ NPL Seeder: ' . count($accountIds) . ' accounts, NPL records, dunning actions, and collection tasks seeded.');
    }
}
