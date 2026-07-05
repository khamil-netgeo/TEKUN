<?php

namespace Tests\Feature\Modules\PengeluaranDana;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Application;
use App\Models\Branch;
use App\Modules\PengeluaranDana\Models\Disbursement;

class DisbursementTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $disbursement;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->artisan('db:seed', ['--class' => 'Database\\Seeders\\RoleSeeder']);

        $this->user = User::where('email', 'admin@tekun.gov.my')->first();
        if (!$this->user) {
            $this->user = User::factory()->create(['email' => 'admin@tekun.gov.my']);
        }

        $branch = Branch::create([
            'code' => 'B001',
            'name' => 'Test Branch',
            'state' => 'Selangor',
            'district' => 'Petaling',
            'status' => 'active'
        ]);

        $app = Application::create([
            'ref_no' => 'APP-TEST-001',
            'applicant_name' => 'Test Applicant',
            'ic_no' => '900101-14-1234',
            'phone' => '0123456789',
            'email' => 'test@example.com',
            'business_name' => 'Test Business',
            'scheme' => 'TEKUN Usahawan',
            'amount_requested' => 10000,
            'tenure_months' => 60,
            'purpose' => 'Modal Pusingan',
            'status' => 'approved',
            'officer_id' => $this->user->id,
            'branch_id' => $branch->id,
            'address' => 'Test Address',
            'postcode' => '12345',
            'city' => 'Test City',
            'state' => 'Selangor'
        ]);

        $this->disbursement = Disbursement::create([
            'application_id' => $app->id,
            'ref_no' => 'DIS-TEST-001',
            'amount' => 10000,
            'bank_name' => 'Maybank',
            'bank_account_no' => '1234567890',
            'bank_account_name' => 'Test User',
            'bank_verified' => true,
            'status' => 'pending',
            'esign_status' => 'pending',
            'approval_level' => 'branch_manager',
            'is_escalated' => false,
            'status' => 'pending',
            'is_batch' => false,
            'aging_days' => 0,
            'ai_anomaly_flag' => false,
            'twofa_required' => true,
            'twofa_confirmed' => false,
            'esign_reminder_sent' => false,
            'esign_ai_anomaly' => false,
            'sla_breach' => false,
            'notify_sent' => false,
            'status' => 'pending',
        ]);
    }

    public function test_can_get_disbursement_list()
    {
        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/disbursements');
        $response->assertStatus(200)
                 ->assertJsonStructure(['success', 'data', 'meta']);
    }

    public function test_can_get_aging_report()
    {
        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/disbursements/aging-report');
        $response->assertStatus(200)
                 ->assertJsonStructure(['success', 'data', 'summary']);
    }

    public function test_can_get_authority_matrix()
    {
        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/disbursements/authority-matrix');
        $response->assertStatus(200)
                 ->assertJsonStructure(['success', 'data']);
    }

    public function test_can_approve_disbursement()
    {
        $response = $this->actingAs($this->user, 'sanctum')->postJson("/api/disbursements/{$this->disbursement->id}/approve");
        $response->assertStatus(200);
        $this->assertDatabaseHas('disbursements', [
            'id' => $this->disbursement->id,
            'status' => 'approved'
        ]);
    }

    public function test_can_batch_process()
    {
        $response = $this->actingAs($this->user, 'sanctum')->postJson('/api/disbursements/batch', [
            'ids' => [$this->disbursement->id],
            'format' => 'fpx'
        ]);
        $response->assertStatus(200);
    }
}
