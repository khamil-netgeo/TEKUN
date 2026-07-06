<?php

namespace App\Modules\PenilaianKredit\Tests;

use Tests\TestCase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * CreditAssessmentTest — M2 Penilaian Risiko & Skor Kredit
 *
 * Uses DatabaseTransactions (not RefreshDatabase) to avoid PostgreSQL deadlocks
 * when multiple test suites run concurrently on the shared sppt_test database.
 * Each test is wrapped in a transaction that rolls back after completion,
 * leaving the schema intact for other concurrent test suites.
 */
class CreditAssessmentTest extends TestCase
{

    protected $token;
    protected $userId;
    protected $appId;

    protected function setUp(): void
    {
        parent::setUp();

        // Use unique identifiers to avoid conflicts with concurrent test runs
        $uniqueSuffix = uniqid();

        // Ensure a branch exists for this test
        $branchId = DB::table('branches')->insertGetId([
            'code'     => 'TST' . substr($uniqueSuffix, -4),
            'name'     => 'Cawangan Test ' . $uniqueSuffix,
            'state'    => 'W.P. Kuala Lumpur',
            'district' => 'Kuala Lumpur',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Insert a credit officer user with full module permissions
        $permissions = json_encode([
            'modules' => ['module1', 'module2', 'module3', 'module4', 'module5',
                          'module6', 'module7', 'module8', 'module9', 'module10',
                          'module11', 'module12'],
            'actions' => ['*'],
        ]);

        $this->userId = DB::table('users')->insertGetId([
            'name'        => 'Pegawai Kredit Test',
            'email'       => 'kredit.test.' . $uniqueSuffix . '@tekun.gov.my',
            'password'    => Hash::make('demo1234'),
            'role'        => 'Pegawai Kredit',
            'role_label'  => 'Pegawai Kredit',
            'branch'      => 'Cawangan KL Sentral',
            'branch_code' => 'KL01',
            'is_active'   => true,
            'is_suspended' => false,
            'permissions' => $permissions,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        // Login to get token
        $response = $this->postJson('/api/auth/login', [
            'email'    => 'kredit.test.' . $uniqueSuffix . '@tekun.gov.my',
            'password' => 'demo1234',
        ]);
        $this->token = $response->json('token');

        // Create an application for this test run
        $this->appId = DB::table('applications')->insertGetId([
            'ref_no'           => 'APP-TEST-' . $uniqueSuffix,
            'applicant_name'   => 'Test Applicant',
            'ic_no'            => '9001' . substr(preg_replace('/[^0-9]/', '', $uniqueSuffix), 0, 8),
            'scheme'           => 'TEKUN Niaga',
            'amount_requested' => 50000,
            'status'           => 'pending_assessment',
            'branch_id'        => $branchId,
            'officer_id'       => $this->userId,
            'phone'            => '0123456789',
            'tenure_months'    => 60,
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);
    }

    public function test_get_applications_returns_list()
    {
        $response = $this->withToken($this->token)
            ->getJson('/api/applications?status=pending');

        $response->assertStatus(200)
            ->assertJsonStructure(['data', 'total', 'per_page', 'current_page', 'last_page']);
    }

    public function test_get_credit_score_returns_score_grade_factors_narrative()
    {
        $response = $this->withToken($this->token)
            ->getJson("/api/applications/{$this->appId}/credit-score");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'application_id', 'score', 'grade', 'grade_label', 'recommendation',
                'factors', 'narrative', 'is_borderline', 'generated_at',
            ]);
    }

    public function test_amortization_returns_flat_schedule()
    {
        $response = $this->withToken($this->token)
            ->getJson("/api/applications/{$this->appId}/amortization?amount=50000&tenure=60&rate=4.0&type=flat");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'application_id', 'amount', 'tenure', 'rate', 'type',
                'monthly_payment', 'total_payment', 'total_interest', 'schedule'
            ]);
    }

    public function test_amortization_returns_reducing_schedule()
    {
        $response = $this->withToken($this->token)
            ->getJson("/api/applications/{$this->appId}/amortization?amount=50000&tenure=60&rate=4.0&type=reducing");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'application_id', 'amount', 'tenure', 'rate', 'type',
                'monthly_payment', 'total_payment', 'total_interest', 'schedule'
            ]);
    }

    public function test_approve_application_updates_status()
    {
        $response = $this->withToken($this->token)
            ->postJson("/api/applications/{$this->appId}/approve", [
                'comments' => 'Approved by test'
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment(['status' => 'approved']);

        $this->assertDatabaseHas('applications', [
            'id'     => $this->appId,
            'status' => 'approved'
        ]);
    }

    public function test_reject_application_updates_status_and_returns_letter()
    {
        $response = $this->withToken($this->token)
            ->postJson("/api/applications/{$this->appId}/reject", [
                'reason' => 'Failed credit score'
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment(['status' => 'rejected'])
            ->assertJsonStructure(['rejection_letter_url']);

        $this->assertDatabaseHas('applications', [
            'id'     => $this->appId,
            'status' => 'rejected'
        ]);
    }

    public function test_kuari_returns_flagged_fields()
    {
        $response = $this->withToken($this->token)
            ->postJson("/api/applications/{$this->appId}/kuari", [
                'fields' => ['ic_no', 'bank_statement'],
                'notes'  => 'Sila muat naik penyata bank yang jelas'
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment(['status' => 'kuari'])
            ->assertJsonStructure(['flagged_fields']);

        $this->assertDatabaseHas('applications', [
            'id'     => $this->appId,
            'status' => 'kuari'
        ]);
    }

    public function test_offer_letter_returns_pdf_url()
    {
        $response = $this->withToken($this->token)
            ->getJson("/api/applications/{$this->appId}/offer-letter");

        $response->assertStatus(200)
            ->assertJsonStructure(['pdf_url']);
    }
}
