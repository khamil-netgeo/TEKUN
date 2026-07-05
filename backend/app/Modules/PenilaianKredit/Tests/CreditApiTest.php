<?php

namespace App\Modules\PenilaianKredit\Tests;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;

/**
 * M2 — Penilaian Risiko & Skor Kredit — PHPUnit Test Suite
 *
 * Uses DatabaseTransactions (not RefreshDatabase) to avoid table-creation
 * conflicts when multiple test suites share the same sppt_test database.
 * All DB changes are rolled back after each test.
 */
class CreditApiTest extends TestCase
{
    use DatabaseTransactions;

    private User $creditOfficer;
    private int $applicationId;

    protected function setUp(): void
    {
        parent::setUp();

        // Reuse existing branch or create one
        $branchId = \DB::table('branches')->where('code', 'BR-TEST-M2')->value('id');
        if (!$branchId) {
            $branchId = \DB::table('branches')->insertGetId([
                'name'       => 'Cawangan Ujian M2',
                'code'       => 'BR-TEST-M2',
                'state'      => 'Selangor',
                'district'   => 'Petaling Jaya',
                'address'    => 'No. 1, Jalan Ujian M2',
                'phone'      => '0312345678',
                'is_active'  => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Create credit officer user
        $this->creditOfficer = User::create([
            'name'        => 'Pegawai Kredit Ujian M2',
            'email'       => 'kredit.test.m2.' . time() . '@tekun.gov.my',
            'password'    => Hash::make('demo1234'),
            'role'        => 'credit_officer',
            'branch_id'   => $branchId,
            'permissions' => [
                'modules'        => ['module2', 'module1', 'module3', 'module4', 'module5'],
                'actions'        => ['view_applications', 'assess_credit', 'generate_offer_letter'],
                'data_scope'     => 'national',
                'approval_limit' => 200000,
            ],
            'is_active' => true,
        ]);

        // Create a test application
        $this->applicationId = \DB::table('applications')->insertGetId([
            'ref_no'           => 'SPPT-TEST-M2-' . time(),
            'applicant_name'   => 'Ahmad Ujian M2',
            'ic_no'            => '8001' . substr(time(), -8),
            'phone'            => '0123456789',
            'scheme'           => 'TEKUN Usahawan',
            'amount_requested' => 20000.00,
            'tenure_months'    => 36,
            'status'           => 'pending_assessment',
            'branch_id'        => $branchId,
            'officer_id'       => $this->creditOfficer->id,
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);
    }

    /** @test */
    public function test_credit_score_endpoint_returns_valid_structure(): void
    {
        $response = $this->actingAs($this->creditOfficer, 'sanctum')
            ->getJson("/api/applications/{$this->applicationId}/credit-score");

        // Accept 200 (AI available) or 503 (AI unavailable in test env)
        $this->assertContains($response->status(), [200, 503],
            'Credit score endpoint must return 200 or 503 (AI unavailable)');

        if ($response->status() === 200) {
            $response->assertJsonStructure([
                'application_id',
                'score',
                'grade',
                'grade_label',
                'recommendation',
                'narrative',
                'is_borderline',
                'factors',
                'risk_factors',
                'positive_factors',
            ]);

            $data = $response->json();
            $this->assertIsInt($data['score']);
            $this->assertGreaterThanOrEqual(0, $data['score']);
            $this->assertLessThanOrEqual(100, $data['score']);
            $this->assertContains($data['grade'], ['A', 'B', 'C', 'D', 'E']);
            $this->assertIsBool($data['is_borderline']);
            $this->assertIsArray($data['factors']);
        } else {
            // 503 — AI unavailable, check error structure
            $response->assertJsonStructure(['message', 'ai_available']);
            $this->assertFalse($response->json('ai_available'));
        }
    }

    /** @test */
    public function test_dashboard_returns_aggregated_stats_from_db(): void
    {
        $response = $this->actingAs($this->creditOfficer, 'sanctum')
            ->getJson('/api/credit/dashboard');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'total_applications',
                'pending_assessment',
                'approved_today',
                'rejected_today',
                'avg_score',
                'borderline_cases',
                'grade_distribution',
            ]);

        $data = $response->json();
        $this->assertIsNumeric($data['total_applications']);
        $this->assertIsNumeric($data['pending_assessment']);
        $this->assertIsArray($data['grade_distribution']);
    }

    /** @test */
    public function test_amortization_returns_full_schedule(): void
    {
        $response = $this->actingAs($this->creditOfficer, 'sanctum')
            ->getJson("/api/applications/{$this->applicationId}/amortization?amount=20000&tenure=36&rate=4&type=flat");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'type',
                'amount',
                'tenure',
                'rate',
                'monthly_payment',
                'total_payment',
                'total_profit',
                'schedule',
            ]);

        $data = $response->json();
        $this->assertCount(36, $data['schedule']);
        $this->assertArrayHasKey('month', $data['schedule'][0]);
        $this->assertArrayHasKey('payment', $data['schedule'][0]);
        $this->assertArrayHasKey('principal', $data['schedule'][0]);
        $this->assertArrayHasKey('profit', $data['schedule'][0]);
        $this->assertArrayHasKey('balance', $data['schedule'][0]);
    }

    /** @test */
    public function test_approve_application_returns_next_stage(): void
    {
        $response = $this->actingAs($this->creditOfficer, 'sanctum')
            ->postJson("/api/applications/{$this->applicationId}/approve", [
                'comments' => 'Diluluskan berdasarkan skor kredit AI yang memuaskan.'
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'next_stage', 'message']);

        $this->assertTrue($response->json('success'));
    }

    /** @test */
    public function test_reject_application_generates_rejection_letter(): void
    {
        $response = $this->actingAs($this->creditOfficer, 'sanctum')
            ->postJson("/api/applications/{$this->applicationId}/reject", [
                'reason' => 'Rekod CCRIS menunjukkan tunggakan aktif melebihi 3 bulan.'
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'message', 'rejection_letter_url']);

        $this->assertTrue($response->json('success'));
        $this->assertNotEmpty($response->json('rejection_letter_url'));
    }

    /** @test */
    public function test_kuari_flags_fields_and_sets_deadline(): void
    {
        $response = $this->actingAs($this->creditOfficer, 'sanctum')
            ->postJson("/api/applications/{$this->applicationId}/kuari", [
                'flagged_fields' => ['ic_number', 'income_proof'],
                'notes'          => 'Sila kemukakan salinan IC terkini dan penyata bank 3 bulan.',
                'deadline_days'  => 7,
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'message', 'flagged_fields', 'deadline']);

        $this->assertTrue($response->json('success'));
        $this->assertIsArray($response->json('flagged_fields'));
    }

    /** @test */
    public function test_offer_letter_generates_pdf_for_approved_application(): void
    {
        // First approve the application
        $this->actingAs($this->creditOfficer, 'sanctum')
            ->postJson("/api/applications/{$this->applicationId}/approve", [
                'comments' => 'Diluluskan untuk ujian surat tawaran.'
            ]);

        // Then request offer letter
        $response = $this->actingAs($this->creditOfficer, 'sanctum')
            ->getJson("/api/applications/{$this->applicationId}/offer-letter");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'pdf_url',
                'filename',
                'ref_no',
                'amount',
                'tenure',
                'rate',
                'monthly_payment',
                'valid_until',
                'generated_at',
            ]);

        $this->assertTrue($response->json('success'));
        $this->assertNotEmpty($response->json('pdf_url'));
    }

    /** @test */
    public function test_credit_narrative_endpoint_returns_ai_narrative(): void
    {
        $response = $this->actingAs($this->creditOfficer, 'sanctum')
            ->postJson('/api/credit/narrative', [
                'application_id' => $this->applicationId,
                'score'          => 72,
                'grade'          => 'B',
                'factors'        => [
                    'character'  => 75,
                    'capacity'   => 70,
                    'capital'    => 65,
                    'collateral' => 80,
                    'condition'  => 70,
                ],
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['narrative', 'recommendation']);

        $this->assertNotEmpty($response->json('narrative'));
        $this->assertNotEmpty($response->json('recommendation'));
    }

    /** @test */
    public function test_unauthenticated_access_is_rejected(): void
    {
        $this->getJson("/api/applications/{$this->applicationId}/credit-score")
            ->assertStatus(401);

        $this->getJson('/api/credit/dashboard')
            ->assertStatus(401);
    }
}
