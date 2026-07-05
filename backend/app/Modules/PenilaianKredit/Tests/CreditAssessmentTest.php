<?php

namespace Tests\Feature\PenilaianKredit;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

/**
 * M2 — Penilaian Risiko & Skor Kredit
 * Feature tests for all required API endpoints.
 */
class CreditAssessmentTest extends TestCase
{
    use RefreshDatabase;

    protected $token;
    protected $userId;
    protected $branchId;
    protected $appId;

    protected function setUp(): void
    {
        parent::setUp();

        // Insert a branch
        $this->branchId = DB::table('branches')->insertGetId([
            'code'       => 'KL01',
            'name'       => 'Cawangan KL Sentral',
            'state'      => 'WP Kuala Lumpur',
            'district'   => 'Kuala Lumpur',
            'address'    => 'Jalan Sentral',
            'phone'      => '03-12345678',
            'is_active'  => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Insert a credit officer user with full module permissions
        $permissions = json_encode([
            'modules' => ['module1', 'module2', 'module3', 'module4', 'module5', 'module6', 'module7', 'module8', 'module9', 'module10', 'module11', 'module12'],
            'actions' => ['*'],
        ]);
        $this->userId = DB::table('users')->insertGetId([
            'name'        => 'Pegawai Kredit Test',
            'email'       => 'kredit.test@tekun.gov.my',
            'password'    => Hash::make('demo1234'),
            'role'        => 'credit_officer',
            'role_label'  => 'Pegawai Kredit',
            'branch'      => 'Cawangan KL Sentral',
            'branch_code' => 'KL01',
            'is_active'   => true,
            'is_suspended'=> false,
            'permissions' => $permissions,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        // Create a Sanctum token directly
        $tokenId = DB::table('personal_access_tokens')->insertGetId([
            'tokenable_type' => 'App\\Models\\User',
            'tokenable_id'   => $this->userId,
            'name'           => 'test-token',
            'token'          => hash('sha256', 'test-token-' . $this->userId),
            'abilities'      => '["*"]',
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);
        $this->token = $tokenId . '|test-token-' . $this->userId;

        // Create a test application
        $this->appId = DB::table('applications')->insertGetId([
            'ref_no'           => 'M2TEST-' . uniqid(),
            'branch_id'        => $this->branchId,
            'officer_id'       => $this->userId,
            'applicant_name'   => 'Test Pemohon M2',
            'ic_no'            => '900101-01-9994',
            'phone'            => '012-3456789',
            'scheme'           => 'TEKUN Usahawan',
            'amount_requested' => 25000,
            'tenure_months'    => 60,
            'status'           => 'pending',
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);
    }

    // =========================================================================
    // TEST 1: GET /api/applications?status=pending — paginated list
    // =========================================================================
    public function test_get_applications_returns_list(): void
    {
        $response = $this->withToken($this->token)
            ->getJson('/api/applications?status=pending');

        $response->assertStatus(200)
            ->assertJsonStructure(['data', 'total', 'per_page', 'current_page', 'last_page']);
    }

    // =========================================================================
    // TEST 2: GET /api/applications/{id}/credit-score
    // =========================================================================
    public function test_get_credit_score_returns_score_grade_factors_narrative(): void
    {
        $response = $this->withToken($this->token)
            ->getJson("/api/applications/{$this->appId}/credit-score");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'score', 'grade', 'grade_label', 'recommendation',
                'factors', 'narrative', 'is_borderline', 'generated_at',
            ]);

        $data = $response->json();
        $this->assertIsInt($data['score']);
        $this->assertGreaterThanOrEqual(0, $data['score']);
        $this->assertLessThanOrEqual(100, $data['score']);
        $this->assertContains($data['grade'], ['A', 'B', 'C', 'D']);
        $this->assertNotEmpty($data['narrative']);
    }

    // =========================================================================
    // TEST 3: GET /api/applications/{id}/amortization?amount=X&tenure=Y&rate=Z&type=flat
    // =========================================================================
    public function test_amortization_flat_rate_returns_full_schedule(): void
    {
        $response = $this->withToken($this->token)
            ->getJson("/api/applications/{$this->appId}/amortization?amount=25000&tenure=60&rate=4.0&type=flat");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'application_id', 'amount', 'tenure', 'rate', 'type',
                'monthly_payment', 'total_payment', 'total_interest', 'schedule',
            ]);

        $data = $response->json();
        $this->assertCount(60, $data['schedule']); // Full 60-month schedule
        $this->assertEquals('flat', $data['type']);
    }

    // =========================================================================
    // TEST 4: GET /api/applications/{id}/amortization?type=reducing
    // =========================================================================
    public function test_amortization_reducing_balance_returns_full_schedule(): void
    {
        $response = $this->withToken($this->token)
            ->getJson("/api/applications/{$this->appId}/amortization?amount=25000&tenure=60&rate=4.0&type=reducing");

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertCount(60, $data['schedule']);
        $this->assertEquals('reducing', $data['type']);
    }

    // =========================================================================
    // TEST 5: POST /api/applications/{id}/approve
    // =========================================================================
    public function test_approve_application_returns_next_stage(): void
    {
        $response = $this->withToken($this->token)
            ->postJson("/api/applications/{$this->appId}/approve", [
                'stage'    => 1,
                'comments' => 'Diluluskan oleh Pegawai Kredit',
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'application_id', 'status', 'next_stage', 'approved_by', 'approved_at']);

        $this->assertTrue($response->json('success'));
        $this->assertNotEmpty($response->json('next_stage'));
    }

    // =========================================================================
    // TEST 6: POST /api/applications/{id}/reject
    // =========================================================================
    public function test_reject_application_returns_rejection_letter_url(): void
    {
        $response = $this->withToken($this->token)
            ->postJson("/api/applications/{$this->appId}/reject", [
                'reason' => 'Skor kredit tidak mencukupi syarat minimum TEKUN Nasional.',
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'application_id', 'status', 'rejection_reason', 'rejection_letter_url', 'rejected_by', 'rejected_at']);

        $this->assertEquals('rejected', $response->json('status'));
        $this->assertNotEmpty($response->json('rejection_letter_url'));
    }

    // =========================================================================
    // TEST 7: POST /api/applications/{id}/kuari
    // =========================================================================
    public function test_kuari_returns_flagged_fields_and_ai_suggestions(): void
    {
        $response = $this->withToken($this->token)
            ->postJson("/api/applications/{$this->appId}/kuari", [
                'flagged_fields' => ['bank_statement', 'income_proof'],
                'deadline'       => now()->addDays(3)->toDateString(),
                'notes'          => 'Dokumen tidak lengkap',
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'kuari_id', 'application_id', 'flagged_fields', 'ai_suggestions', 'deadline', 'sent_at']);

        $this->assertTrue($response->json('success'));
        $this->assertCount(2, $response->json('flagged_fields'));
        $this->assertCount(2, $response->json('ai_suggestions'));
    }

    // =========================================================================
    // TEST 8: GET /api/applications/{id}/offer-letter
    // =========================================================================
    public function test_offer_letter_returns_pdf_url(): void
    {
        // First approve the application
        DB::table('applications')->where('id', $this->appId)->update(['status' => 'approved']);

        $response = $this->withToken($this->token)
            ->getJson("/api/applications/{$this->appId}/offer-letter");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'offer_number', 'application_id', 'applicant_name', 'scheme',
                'amount_approved', 'tenure_months', 'profit_rate', 'monthly_payment',
                'total_payment', 'offer_date', 'expiry_date', 'pdf_url', 'status', 'generated_at',
            ]);

        $this->assertNotEmpty($response->json('pdf_url'));
        $this->assertNotEmpty($response->json('offer_number'));
    }

    // =========================================================================
    // TEST 9: POST /api/credit/narrative (AI credit narrative)
    // =========================================================================
    public function test_credit_narrative_returns_narrative_and_recommendation(): void
    {
        $response = $this->withToken($this->token)
            ->postJson('/api/credit/narrative', [
                'score'           => 72,
                'grade'           => 'B',
                'applicant_name'  => 'Ahmad bin Ismail',
                'amount'          => 25000,
                'scheme'          => 'TEKUN Usahawan',
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['score', 'grade', 'narrative', 'recommendation', 'scheme', 'generated_at']);

        $this->assertNotEmpty($response->json('narrative'));
        $this->assertContains($response->json('recommendation'), ['DILULUSKAN', 'KUARI', 'TIDAK DILULUSKAN']);
    }

    // =========================================================================
    // TEST 10: GET /api/applications/{id}/workflow (approval stepper)
    // =========================================================================
    public function test_workflow_returns_stages(): void
    {
        $response = $this->withToken($this->token)
            ->getJson("/api/applications/{$this->appId}/workflow");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'application_id', 'current_stage', 'total_stages', 'overall_status', 'stages',
            ]);

        $this->assertEquals(3, $response->json('total_stages'));
        $this->assertCount(3, $response->json('stages'));
    }

    // =========================================================================
    // TEST 11: Borderline case (score 45-55) returns mitigation options
    // =========================================================================
    public function test_borderline_score_returns_mitigation_options(): void
    {
        // Create an application with a predictable borderline score
        // We use a specific IC to get a borderline score
        $borderlineAppId = DB::table('applications')->insertGetId([
            'ref_no'           => 'M2BORDER-' . uniqid(),
            'branch_id'        => $this->branchId,
            'officer_id'       => $this->userId,
            'applicant_name'   => 'Borderline Pemohon',
            'ic_no'            => '900101-01-0001',
            'phone'            => '012-9999999',
            'scheme'           => 'TEKUN Usahawan',
            'amount_requested' => 10000,
            'tenure_months'    => 36,
            'status'           => 'pending',
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        $response = $this->withToken($this->token)
            ->getJson("/api/applications/{$borderlineAppId}/credit-score");

        $response->assertStatus(200);
        $data = $response->json();

        // If it's borderline, verify mitigation options are present
        if ($data['is_borderline']) {
            $this->assertNotEmpty($data['mitigation_options']);
            $this->assertCount(3, $data['mitigation_options']);
            foreach ($data['mitigation_options'] as $option) {
                $this->assertArrayHasKey('option', $option);
                $this->assertArrayHasKey('title', $option);
                $this->assertArrayHasKey('revised_score', $option);
            }
        } else {
            // Non-borderline: mitigation_options should be empty
            $this->assertEmpty($data['mitigation_options']);
        }
    }

    // =========================================================================
    // TEST 12: 404 for non-existent application
    // =========================================================================
    public function test_credit_score_returns_404_for_nonexistent_app(): void
    {
        $response = $this->withToken($this->token)
            ->getJson('/api/applications/99999999/credit-score');

        $response->assertStatus(404);
    }
}
