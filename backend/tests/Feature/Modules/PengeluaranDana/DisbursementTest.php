<?php

namespace Tests\Feature\Modules\PengeluaranDana;

use Tests\TestCase;
use App\Models\User;
use App\Models\Application;
use App\Models\Disbursement;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * DisbursementTest — Module 3 (Pengeluaran Dana)
 * 18 test cases covering all endpoints, RBAC, and edge cases.
 */
class DisbursementTest extends TestCase
{
    use RefreshDatabase;

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
            'role'  => 'system_admin',
        ]);
        $this->adminUser->syncRoles(['system_admin']);

        // Create branch officer user
        $this->officerUser = User::factory()->create([
            'email' => 'test-officer-m3@tekun.gov.my',
            'name'  => 'Test Officer M3',
            'role'  => 'branch_officer',
        ]);
        $this->officerUser->syncRoles(['branch_officer']);

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
            'aging_days'     => 3,
            'sla_breach'     => true,
        ]);
    }

    // ─── 1. Unauthenticated access rejected ───────────────────────────────────

    public function test_unauthenticated_cannot_access_disbursements(): void
    {
        $this->getJson('/api/disbursements')->assertStatus(401);
    }

    // ─── 2. List returns paginated real data ──────────────────────────────────

    public function test_can_get_disbursement_list(): void
    {
        $this->actingAs($this->adminUser, 'sanctum')
             ->getJson('/api/disbursements')
             ->assertStatus(200)
             ->assertJsonStructure(['success', 'data', 'meta' => ['total', 'ready', 'pending_esign', 'processed_today', 'total_amount']])
             ->assertJson(['success' => true]);
    }

    // ─── 3. Status filter works ───────────────────────────────────────────────

    public function test_disbursement_list_supports_status_filter(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
                         ->getJson('/api/disbursements?status=pending');

        $response->assertStatus(200)->assertJson(['success' => true]);
        foreach ($response->json('data') as $item) {
            $this->assertEquals('pending', $item['status']);
        }
    }

    // ─── 4. Aging report returns SLA data ─────────────────────────────────────

    public function test_can_get_aging_report(): void
    {
        $this->actingAs($this->adminUser, 'sanctum')
             ->getJson('/api/disbursements/aging-report')
             ->assertStatus(200)
             ->assertJsonStructure(['success', 'data', 'summary' => ['critical', 'warning', 'normal', 'total', 'auto_escalated']]);
    }

    // ─── 5. Aging report SLA categories correct ───────────────────────────────

    public function test_aging_report_sla_categories_are_correct(): void
    {
        Disbursement::factory()->create([
            'application_id' => $this->application->id,
            'ref_no'         => 'DIS-AGING-SLA-01',
            'amount'         => 5000,
            'status'         => 'pending',
            'esign_status'   => 'pending',
            'created_at'     => now()->subDays(5),
            'updated_at'     => now()->subDays(5),
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
                         ->getJson('/api/disbursements/aging-report');

        $response->assertStatus(200);
        $this->assertGreaterThan(0, $response->json('summary.critical'));
    }

    // ─── 6. Authority matrix returns 4 levels ─────────────────────────────────

    public function test_can_get_authority_matrix(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
                         ->getJson('/api/disbursements/authority-matrix?amount=15000');

        $response->assertStatus(200)
                 ->assertJsonStructure(['success', 'data', 'applicable'])
                 ->assertJson(['success' => true]);

        $this->assertCount(4, $response->json('data'));
    }

    // ─── 7. Authority matrix applicable level correct ─────────────────────────

    public function test_authority_matrix_applicable_level_correct(): void
    {
        $r1 = $this->actingAs($this->adminUser, 'sanctum')
                   ->getJson('/api/disbursements/authority-matrix?amount=5000');
        $this->assertEquals('branch_officer', $r1->json('applicable.level'));

        $r2 = $this->actingAs($this->adminUser, 'sanctum')
                   ->getJson('/api/disbursements/authority-matrix?amount=150000');
        $this->assertEquals('executive', $r2->json('applicable.level'));
    }

    // ─── 8. E-sign queue returns records ──────────────────────────────────────

    public function test_can_get_esign_queue(): void
    {
        $this->actingAs($this->adminUser, 'sanctum')
             ->getJson('/api/disbursements/esign-queue')
             ->assertStatus(200)
             ->assertJsonStructure(['success', 'data', 'stats' => ['signed', 'pending', 'expired', 'total']]);
    }

    // ─── 9. Admin can approve disbursement ────────────────────────────────────

    public function test_can_approve_disbursement(): void
    {
        $this->actingAs($this->adminUser, 'sanctum')
             ->postJson("/api/disbursements/{$this->disbursement->id}/approve")
             ->assertStatus(200)
             ->assertJson(['success' => true]);

        $this->assertDatabaseHas('disbursements', ['id' => $this->disbursement->id, 'status' => 'approved']);
    }

    // ─── 10. Branch officer cannot approve executive-level amount ─────────────

    public function test_branch_officer_cannot_approve_executive_amount(): void
    {
        $bigDisbursement = Disbursement::factory()->create([
            'application_id' => $this->application->id,
            'ref_no'         => 'DIS-TEST-BIG-01',
            'amount'         => 200000,
            'status'         => 'pending',
            'esign_status'   => 'signed',
        ]);

        $this->actingAs($this->officerUser, 'sanctum')
             ->postJson("/api/disbursements/{$bigDisbursement->id}/approve")
             ->assertStatus(403);
    }

    // ─── 11. Escalate disbursement ────────────────────────────────────────────

    public function test_can_escalate_disbursement(): void
    {
        $this->actingAs($this->adminUser, 'sanctum')
             ->postJson("/api/disbursements/{$this->disbursement->id}/escalate", ['reason' => 'SLA melebihi 2 hari'])
             ->assertStatus(200)
             ->assertJson(['success' => true]);

        $this->assertDatabaseHas('disbursements', ['id' => $this->disbursement->id, 'is_escalated' => true]);
    }

    // ─── 12. Batch processing ─────────────────────────────────────────────────

    public function test_can_batch_process_disbursements(): void
    {
        $d2 = Disbursement::factory()->create([
            'application_id' => $this->application->id,
            'ref_no'         => 'DIS-TEST-BATCH-01',
            'amount'         => 8000,
            'status'         => 'pending',
            'esign_status'   => 'signed',
        ]);

        $this->actingAs($this->adminUser, 'sanctum')
             ->postJson('/api/disbursements/batch', ['ids' => [$this->disbursement->id, $d2->id], 'format' => 'fpx'])
             ->assertStatus(200)
             ->assertJson(['success' => true])
             ->assertJsonStructure(['data' => ['batch_id', 'count', 'format']]);

        $this->assertDatabaseHas('disbursements', ['id' => $this->disbursement->id, 'status' => 'processing']);
    }

    // ─── 13. Batch requires IDs ───────────────────────────────────────────────

    public function test_batch_requires_ids(): void
    {
        $this->actingAs($this->adminUser, 'sanctum')
             ->postJson('/api/disbursements/batch', ['ids' => []])
             ->assertStatus(422);
    }

    // ─── 14. Send e-sign reminder ─────────────────────────────────────────────

    public function test_can_send_esign_reminder(): void
    {
        $this->actingAs($this->adminUser, 'sanctum')
             ->postJson("/api/disbursements/{$this->disbursement->id}/send-esign")
             ->assertStatus(200)
             ->assertJson(['success' => true])
             ->assertJsonStructure(['data' => ['id', 'reminder_sent_at', 'channel']]);

        $this->assertDatabaseHas('disbursements', ['id' => $this->disbursement->id, 'esign_reminder_sent' => true]);
    }

    // ─── 15. Offer letter data endpoint ──────────────────────────────────────

    public function test_can_get_offer_letter_data(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
                         ->getJson("/api/disbursements/{$this->disbursement->id}/offer-letter");

        $response->assertStatus(200)
                 ->assertJson(['success' => true])
                 ->assertJsonStructure([
                     'data' => ['ref_no', 'applicant_name', 'ic_no', 'amount', 'tenure', 'rate', 'monthly', 'total_profit', 'total_payable', 'schedule'],
                 ]);

        $this->assertGreaterThanOrEqual(1, count($response->json('data.schedule')));
    }

    // ─── 16. Create disbursement ──────────────────────────────────────────────

    public function test_can_create_disbursement(): void
    {
        $this->actingAs($this->adminUser, 'sanctum')
             ->postJson('/api/disbursements', [
                 'application_id'    => $this->application->id,
                 'amount'            => 12000,
                 'bank_name'         => 'CIMB Islamic',
                 'bank_account_no'   => '7001234567',
                 'bank_account_name' => 'Ahmad Bin Razak',
             ])
             ->assertStatus(201)
             ->assertJson(['success' => true]);

        $this->assertDatabaseHas('disbursements', ['amount' => 12000, 'status' => 'pending']);
    }

    // ─── 17. Show single disbursement ────────────────────────────────────────

    public function test_can_show_single_disbursement(): void
    {
        $this->actingAs($this->adminUser, 'sanctum')
             ->getJson("/api/disbursements/{$this->disbursement->id}")
             ->assertStatus(200)
             ->assertJson(['success' => true])
             ->assertJsonPath('data.id', $this->disbursement->id);
    }

    // ─── 18. Update disbursement ──────────────────────────────────────────────

    public function test_can_update_disbursement(): void
    {
        $this->actingAs($this->adminUser, 'sanctum')
             ->putJson("/api/disbursements/{$this->disbursement->id}", ['bank_name' => 'RHB Islamic'])
             ->assertStatus(200)
             ->assertJson(['success' => true]);

        $this->assertDatabaseHas('disbursements', ['id' => $this->disbursement->id, 'bank_name' => 'RHB Islamic']);
    }
}
