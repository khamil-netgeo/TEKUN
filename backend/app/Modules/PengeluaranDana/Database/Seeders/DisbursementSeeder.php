<?php

namespace App\Modules\PengeluaranDana\Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Module 3 — Pengeluaran Dana Seeder
 * Seeds realistic disbursement records for POC demonstration.
 */
class DisbursementSeeder extends Seeder
{
    public function run(): void
    {
        // Get approved application IDs
        $approvedApps = DB::table('applications')
            ->whereIn('status', ['approved', 'disbursed'])
            ->get();

        if ($approvedApps->isEmpty()) {
            $this->command->warn('No approved applications found. Seeding standalone disbursement records.');
        }

        // Get user IDs for officers
        $users = DB::table('users')->get()->keyBy('email');
        $pegawaiId = $users['pegawai@tekun.gov.my']->id ?? 1;
        $pengurusId = $users['pengurus@tekun.gov.my']->id ?? 2;
        $kreditId = $users['kredit@tekun.gov.my']->id ?? 3;
        $eksekutifId = $users['eksekutif@tekun.gov.my']->id ?? 4;

        // Get branch 1 ID
        $branchId = DB::table('branches')->first()?->id ?? 1;

        // Ensure we have enough approved applications by updating some to approved
        $appIds = $approvedApps->pluck('id')->toArray();

        // If we have fewer than 2 approved apps, use what we have
        if (count($appIds) < 2) {
            // Create a minimal application record for seeding
            $appId1 = DB::table('applications')->insertGetId([
                'ref_no'           => 'SPPT-SEED-0001',
                'branch_id'        => $branchId,
                'officer_id'       => $pegawaiId,
                'applicant_name'   => 'Siti Nurhaliza binti Mohd',
                'ic_no'            => '850101-14-5678',
                'phone'            => '0123456789',
                'scheme'           => 'tekun_usahawan',
                'amount_requested' => 25000.00,
                'tenure_months'    => 36,
                'status'           => 'approved',
                'auto_rejected'    => false,
                'ccris_checked'    => true,
                'ctos_checked'     => true,
                'created_at'       => now()->subDays(10),
                'updated_at'       => now()->subDays(2),
            ]);
            $appIds[] = $appId1;

            $appId2 = DB::table('applications')->insertGetId([
                'ref_no'           => 'SPPT-SEED-0002',
                'branch_id'        => $branchId,
                'officer_id'       => $pegawaiId,
                'applicant_name'   => 'Ahmad Razif bin Othman',
                'ic_no'            => '900202-10-1234',
                'phone'            => '0198765432',
                'scheme'           => 'tekun_micro',
                'amount_requested' => 8000.00,
                'tenure_months'    => 24,
                'status'           => 'approved',
                'auto_rejected'    => false,
                'ccris_checked'    => true,
                'ctos_checked'     => true,
                'created_at'       => now()->subDays(8),
                'updated_at'       => now()->subDays(1),
            ]);
            $appIds[] = $appId2;
        }

        // Seed disbursement records
        $disbursements = [
            [
                'application_id'           => $appIds[0] ?? $appIds[0],
                'ref_no'                   => 'DIS-2026-07-00089',
                'amount'                   => 25000.00,
                'bank_name'               => 'Maybank',
                'bank_account_no'         => '1234567890',
                'bank_account_name'       => 'Siti Nurhaliza binti Mohd',
                'bank_verified'           => true,
                'status'                  => 'approved',
                'approval_level'          => 'L2',
                'approved_by_l1'          => $pegawaiId,
                'approved_by_l2'          => $pengurusId,
                'approved_at'             => now()->subDays(2),
                'esign_status'            => 'signed',
                'esign_ref'               => 'ESIGN-2026-0089',
                'esigned_at'              => now()->subDays(1),
                'esign_sent_at'           => now()->subDays(3),
                'esign_deadline'          => now()->addDays(4),
                'is_batch'               => false,
                'aging_days'             => 2,
                'is_escalated'           => false,
                'ai_anomaly_flag'        => false,
                'authority_level_required' => 'branch_manager',
                'authority_label'        => 'Pengurus Cawangan',
                'twofa_required'         => true,
                'twofa_confirmed'        => true,
                'twofa_confirmed_at'     => now()->subDays(1),
                'twofa_confirmed_by'     => $pengurusId,
                'sla_breach'             => false,
                'notify_sent'            => false,
                'created_at'             => now()->subDays(5),
                'updated_at'             => now()->subDays(1),
            ],
            [
                'application_id'           => $appIds[1] ?? $appIds[0],
                'ref_no'                   => 'DIS-2026-07-00090',
                'amount'                   => 8000.00,
                'bank_name'               => 'CIMB',
                'bank_account_no'         => '9876543210',
                'bank_account_name'       => 'Ahmad Razif bin Othman',
                'bank_verified'           => true,
                'status'                  => 'approved',
                'approval_level'          => 'L1',
                'approved_by_l1'          => $pegawaiId,
                'approved_at'             => now()->subDays(1),
                'esign_status'            => 'signed',
                'esign_ref'               => 'ESIGN-2026-0090',
                'esigned_at'              => now()->subHours(12),
                'esign_sent_at'           => now()->subDays(2),
                'esign_deadline'          => now()->addDays(5),
                'is_batch'               => false,
                'aging_days'             => 1,
                'is_escalated'           => false,
                'ai_anomaly_flag'        => false,
                'authority_level_required' => 'branch_officer',
                'authority_label'        => 'Pegawai Cawangan',
                'twofa_required'         => true,
                'twofa_confirmed'        => false,
                'sla_breach'             => false,
                'notify_sent'            => false,
                'created_at'             => now()->subDays(3),
                'updated_at'             => now()->subHours(12),
            ],
        ];

        // Only insert if disbursements table is empty
        if (DB::table('disbursements')->count() === 0) {
            foreach ($disbursements as $d) {
                DB::table('disbursements')->insert($d);
            }
            $this->command->info('Disbursement seeder: ' . count($disbursements) . ' records inserted.');
        } else {
            $this->command->info('Disbursement seeder: Table already has data, skipping.');
        }
    }
}
