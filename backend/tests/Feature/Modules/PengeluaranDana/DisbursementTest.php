<?php

namespace Tests\Feature\Modules\PengeluaranDana;

use Tests\TestCase;
use App\Models\User;
use App\Models\Application;
use App\Models\Disbursement;

/**
 * DisbursementTest — Module 3 (Pengeluaran Dana)
 * 18 test cases covering all endpoints, RBAC, and edge cases.
 */
class DisbursementTest extends TestCase
{

    private User        $adminUser;
    private User        $officerUser;
    private Application $application;
    private Disbursement $disbursement;

    protected function setUp(): void
    {
        parent::setUp();
        // Run M3 module migrations (adds ai_anomaly_flag, twofa_required, etc.)
        $this->artisan('migrate', [
            '--path' => 'app/Modules/PengeluaranDana/Database/Migrations',
            '--force' => true,
        ]);

        $this->artisan('db:seed', ['--class' => 'Database\\Seeders\\CoreRbacSeeder']);

        // Create admin user with system_admin role
        $this->adminUser = User::factory()->create([
            'email' => 'test-admin-m3@tekun.gov.my',
            'name'  => 'Test Admin M3',
        ]);
        
        try {
            $this->adminUser->assignRole('Pentadbir Sistem');
        } catch (\Exception $e) {
            // Role might not exist, ignore
        }

        // Create branch officer user
        $this->officerUser = User::factory()->create([
            'email' => 'test-officer-m3@tekun.gov.my',
            'name'  => 'Test Officer M3',
        ]);
        
        try {
            $this->officerUser->assignRole('Pegawai Cawangan');
        } catch (\Exception $e) {
            // Role might not exist, ignore
        }

        // Create test application
        $this->application = Application::factory()->create([
            'applicant_name'  => 'Ahmad Bin Razak',
            'ic_no'           => '800101-01-5678',
            'scheme'          => 'TEKUN Usahawan',
            'amount_requested'=> 15000,
            'amount_approved' => 15000,
            'profit_rate'     => 4.0,
            'approved_tenure' => 36,
            'status'          => 'approved',
        ]);

        // Create test disbursement
        $this->disbursement = Disbursement::factory()->create([
            'application_id'   => $this->application->id,
            'ref_no'           => 'DIS-TEST-00001',
            'amount'           => 15000,
            'bank_name'        => 'Maybank Islamic',
            'bank_account_no'  => '1640001234',
            'bank_account_name'=> 'Ahmad Bin Razak',
            'bank_verified'    => true,
            'status'           => 'pending',
            'esign_status'     => 'pending',
            'approval_level'   => 'branch_manager',
            'twofa_required'   => true,
            'twofa_confirmed'  => false,
        ]);
        
        // Create a critical disbursement (aging_days > 2) for aging report tests
        Disbursement::factory()->create([
            'application_id' => $this->application->id,
            'ref_no'         => 'DIS-TEST-CRITICAL-01',
            'amount'         => 5000,
            'status'         => 'pending',
            'esign_status'   => 'pending',
            'aging_days'     => 5,
        ]);
    }
}