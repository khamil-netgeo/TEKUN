<?php

namespace App\Modules\PengeluaranDana\Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Disbursement;
use App\Models\Application;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * DisbursementSeeder — Module 3 (Pengeluaran Dana)
 * Seeds 17 realistic disbursement records covering all status/SLA/esign scenarios.
 */
class DisbursementSeeder extends Seeder
{
    public function run(): void
    {
        $admin   = User::where('email', 'admin@tekun.gov.my')->first()   ?? User::first();
        $manager = User::where('email', 'pengurus@tekun.gov.my')->first() ?? User::first();

        $applications = Application::take(20)->get();

        if ($applications->count() < 5) {
            $this->command->warn('Insufficient applications. Run ApplicationSeeder first.');
            return;
        }

        DB::statement('TRUNCATE TABLE disbursements RESTART IDENTITY CASCADE');

        $scenarios = [
            ['amount' => 5000,   'status' => 'pending',    'esign' => 'pending',  'days_ago' => 5,  'escalated' => true,  'ai_anomaly' => false],
            ['amount' => 25000,  'status' => 'pending',    'esign' => 'signed',   'days_ago' => 4,  'escalated' => true,  'ai_anomaly' => true],
            ['amount' => 75000,  'status' => 'pending',    'esign' => 'pending',  'days_ago' => 2,  'escalated' => false, 'ai_anomaly' => false],
            ['amount' => 10000,  'status' => 'pending',    'esign' => 'signed',   'days_ago' => 1,  'escalated' => false, 'ai_anomaly' => false],
            ['amount' => 150000, 'status' => 'pending',    'esign' => 'pending',  'days_ago' => 0,  'escalated' => false, 'ai_anomaly' => true],
            ['amount' => 15000,  'status' => 'pending',    'esign' => 'pending',  'days_ago' => 0,  'escalated' => false, 'ai_anomaly' => false],
            ['amount' => 8000,   'status' => 'approved',   'esign' => 'signed',   'days_ago' => 10, 'escalated' => false, 'ai_anomaly' => false],
            ['amount' => 28000,  'status' => 'approved',   'esign' => 'signed',   'days_ago' => 15, 'escalated' => false, 'ai_anomaly' => false],
            ['amount' => 95000,  'status' => 'processing', 'esign' => 'signed',   'days_ago' => 8,  'escalated' => false, 'ai_anomaly' => false],
            ['amount' => 12000,  'status' => 'pending',    'esign' => 'expired',  'days_ago' => 20, 'escalated' => true,  'ai_anomaly' => false],
            ['amount' => 50000,  'status' => 'pending',    'esign' => 'rejected', 'days_ago' => 3,  'escalated' => false, 'ai_anomaly' => true],
            ['amount' => 7500,   'status' => 'completed',  'esign' => 'signed',   'days_ago' => 30, 'escalated' => false, 'ai_anomaly' => false],
            ['amount' => 45000,  'status' => 'failed',     'esign' => 'signed',   'days_ago' => 12, 'escalated' => false, 'ai_anomaly' => true],
            ['amount' => 88000,  'status' => 'pending',    'esign' => 'pending',  'days_ago' => 1,  'escalated' => false, 'ai_anomaly' => true],
            ['amount' => 200000, 'status' => 'approved',   'esign' => 'signed',   'days_ago' => 7,  'escalated' => false, 'ai_anomaly' => false],
            ['amount' => 18000,  'status' => 'processing', 'esign' => 'signed',   'days_ago' => 2,  'escalated' => false, 'ai_anomaly' => false],
            ['amount' => 32000,  'status' => 'pending',    'esign' => 'pending',  'days_ago' => 6,  'escalated' => true,  'ai_anomaly' => false],
        ];

        $bankNames = [
            'Maybank Islamic', 'CIMB Islamic', 'Bank Islam Malaysia',
            'RHB Islamic', 'Public Islamic Bank', 'AmBank Islamic',
        ];

        foreach ($scenarios as $index => $scenario) {
            $app = $applications->get($index % $applications->count());
            if (!$app) continue;

            $createdAt      = Carbon::now()->subDays($scenario['days_ago'])->subHours(rand(0, 23));
            $authorityLevel = Disbursement::determineAuthority($scenario['amount']);
            $isBatch        = $scenario['status'] === 'processing' && $index % 3 === 0;
            $isApproved     = in_array($scenario['status'], ['approved', 'processing', 'completed']);

            Disbursement::create([
                'application_id'    => $app->id,
                'ref_no'            => 'DIS-' . now()->format('Y-m') . '-' . str_pad($index + 1, 5, '0', STR_PAD_LEFT),
                'amount'            => $scenario['amount'],
                'bank_name'         => $bankNames[$index % count($bankNames)],
                'bank_account_no'   => '164' . str_pad(rand(1000000, 9999999), 7, '0', STR_PAD_LEFT),
                'bank_account_name' => $app->applicant_name,
                'bank_verified'     => true,
                'status'            => $scenario['status'],
                'approval_level'    => $authorityLevel,
                'approved_by_l1'    => $isApproved ? $manager->id : null,
                'approved_at'       => $isApproved ? $createdAt->copy()->addDays(1) : null,
                'esign_status'      => $scenario['esign'],
                'esigned_at'        => $scenario['esign'] === 'signed' ? $createdAt->copy()->addHours(rand(2, 48)) : null,
                'is_batch'          => $isBatch,
                'batch_ref'         => $isBatch ? 'BATCH-' . $createdAt->format('YmdHis') : null,
                'disbursed_at'      => $scenario['status'] === 'completed' ? $createdAt->copy()->addDays(2) : null,
                'aging_days'        => $scenario['days_ago'],
                'is_escalated'      => $scenario['escalated'],
                'escalated_at'      => $scenario['escalated'] ? $createdAt->copy()->addDays(1) : null,
                'escalation_reason' => $scenario['escalated'] ? 'SLA melebihi had — dieskalasi secara automatik' : null,
                'ai_anomaly_flag'   => $scenario['ai_anomaly'],
                'ai_anomaly_reason' => $scenario['ai_anomaly'] ? 'Enjin AI SPPT mengesan corak tidak biasa dalam data pemohon.' : null,
                'ai_anomaly_score'  => $scenario['ai_anomaly'] ? round(rand(65, 95) / 100, 2) : null,
                'twofa_required'    => true,
                'twofa_confirmed'   => $isApproved,
                'sla_breach'        => $scenario['days_ago'] > 2,
                'sla_breach_at'     => $scenario['days_ago'] > 2 ? $createdAt->copy()->addDays(2) : null,
                'notify_sent'       => in_array($scenario['status'], ['approved', 'completed']),
                'notify_channel'    => in_array($scenario['status'], ['approved', 'completed']) ? 'sms_email' : null,
                'created_at'        => $createdAt,
                'updated_at'        => $createdAt,
            ]);
        }

        $this->command->info('✅ ' . count($scenarios) . ' disbursement records seeded (M3).');
    }
}
