<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Branch;
use App\Models\Document;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Module 1 — Permohonan & Semakan Kelayakan Tests
 *
 * Tests all required API endpoints:
 *   POST   /api/applications
 *   GET    /api/applications/{id}
 *   PUT    /api/applications/{id}
 *   POST   /api/applications/{id}/documents
 *   GET    /api/applications/{id}/timeline
 *   POST   /api/ai/document-check
 *   GET    /api/integrations/check/{ic_number}
 */
class Module1ApplicationTest extends TestCase
{
    use RefreshDatabase;

    protected User $officer;
    protected Branch $branch;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('s3');

        // Seed RBAC roles and permissions
        $this->artisan('db:seed', ['--class' => 'CoreRbacSeeder']);

        // Create test branch
        $this->branch = Branch::create([
            'code'         => 'TEST01',
            'name'         => 'Cawangan Test',
            'state'        => 'WP Kuala Lumpur',
            'district'     => 'Kuala Lumpur',
            'address'      => 'No 1, Jalan Test',
            'phone'        => '0312345678',
            'email'        => 'test@tekun.gov.my',
            'manager_name' => 'Test Manager',
            'is_active'    => true,
        ]);

        // Create test officer with module1 access
        $this->officer = User::create([
            'name'                => 'Pegawai Test',
            'email'               => 'pegawai.test@tekun.gov.my',
            'password'            => Hash::make('Demo@TEKUN2026!'),
            'role'                => 'branch_officer',
            'role_label'          => 'Pegawai Cawangan',
            'branch'              => 'Cawangan Test',
            'branch_code'         => 'TEST01',
            'state'               => 'WP Kuala Lumpur',
            'is_active'           => true,
            'is_suspended'        => false,
            'password_changed_at' => now(),
            'password_expires_at' => now()->addDays(90),
            'permissions'         => [
                'modules'      => ['module1', 'module2', 'module4', 'module5', 'module7'],
                'actions'      => ['application.view_branch', 'application.create', 'credit.view'],
                'data_scope'   => 'branch',
                'approval_limit' => 0,
            ],
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper: create a minimal valid application directly in DB
    // ─────────────────────────────────────────────────────────────────────────
    private function makeApplication(array $overrides = []): Application
    {
        return Application::create(array_merge([
            'ref_no'           => 'APP-TEST-' . uniqid(),
            'branch_id'        => $this->branch->id,
            'officer_id'       => $this->officer->id,
            'applicant_name'   => 'Ahmad bin Ali',
            'ic_no'            => '850101-14-5678',
            'phone'            => '0123456789',
            'email'            => 'ahmad@example.com',
            'address'          => 'No 1, Jalan Merdeka',
            'state'            => 'Kuala Lumpur',
            'district'         => 'Kuala Lumpur',
            'scheme'           => 'tekun_micro',
            'amount_requested' => 5000,
            'tenure_months'    => 24,
            'purpose'          => 'Modal perniagaan',
            'sector'           => 'Makanan & Minuman',
            'race'             => 'Melayu',
            'gender'           => 'Lelaki',
            'dob'              => '1985-01-01',
            'status'           => 'draft',
        ], $overrides));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/applications → 201 + data.id
    // ─────────────────────────────────────────────────────────────────────────
    public function test_create_application_returns_201_with_application_id(): void
    {
        $response = $this->actingAs($this->officer, 'sanctum')
            ->postJson('/api/applications', [
                'full_name'        => 'Ahmad bin Ali',
                'ic_no'            => '850101-14-5678',
                'phone'            => '0123456789',
                'email'            => 'ahmad@example.com',
                'business_address' => 'No 1, Jalan Merdeka, Kuala Lumpur',
                'scheme'           => 'tekun_micro',
                'amount_requested' => 5000,
                'tenure_months'    => 24,
                'loan_purpose'     => 'Modal perniagaan',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['data' => ['id', 'ref_no', 'status']]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/applications/{id} → 200 + full data
    // ─────────────────────────────────────────────────────────────────────────
    public function test_get_application_returns_full_data(): void
    {
        $app = $this->makeApplication();

        $response = $this->actingAs($this->officer, 'sanctum')
            ->getJson("/api/applications/{$app->id}");

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => ['id', 'ref_no', 'applicant_name', 'status', 'scheme']]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUT /api/applications/{id} → 200
    // ─────────────────────────────────────────────────────────────────────────
    public function test_update_application_returns_200(): void
    {
        $app = $this->makeApplication();

        $response = $this->actingAs($this->officer, 'sanctum')
            ->putJson("/api/applications/{$app->id}", [
                'loan_purpose' => 'Pembelian peralatan perniagaan',
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/applications/{id}/documents → 201
    // ─────────────────────────────────────────────────────────────────────────
    public function test_upload_document_returns_201(): void
    {
        $app  = $this->makeApplication();
        $file = UploadedFile::fake()->create('mykad_front.jpg', 100, 'image/jpeg');

        $response = $this->actingAs($this->officer, 'sanctum')
            ->postJson("/api/applications/{$app->id}/documents", [
                'file' => $file,
                'type' => 'ic_front',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['document' => ['id', 'type']]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/applications/{id}/timeline → 200 + steps array
    // ─────────────────────────────────────────────────────────────────────────
    public function test_get_timeline_returns_stages_array(): void
    {
        $app = $this->makeApplication(['status' => 'submitted', 'submitted_at' => now()]);

        $response = $this->actingAs($this->officer, 'sanctum')
            ->getJson("/api/applications/{$app->id}/timeline");

        $response->assertStatus(200)
            ->assertJsonStructure(['steps', 'ref_no', 'status']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/integrations/check/{ic_number} → 200 + {esyariah, muflis, ssm, ccris, ctos, mykad}
    // ─────────────────────────────────────────────────────────────────────────
    public function test_integrations_check_returns_all_six_apis(): void
    {
        $response = $this->actingAs($this->officer, 'sanctum')
            ->getJson('/api/integrations/check/850101145678');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'ic_number',
                'eligible',
                'reject_reasons',
                'checks' => ['esyariah', 'muflis', 'ssm', 'ccris', 'ctos', 'mykad'],
                'checked_at',
            ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET /api/integrations/check/{ic_number} — invalid IC format → 404 or 422
    // ─────────────────────────────────────────────────────────────────────────
    public function test_integrations_check_rejects_invalid_ic_format(): void
    {
        $response = $this->actingAs($this->officer, 'sanctum')
            ->getJson('/api/integrations/check/INVALID123');

        // Should return 404 (no route match) or 422 (validation error)
        $this->assertContains($response->status(), [404, 422]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // POST /api/ai/document-check → endpoint exists (200 or 500 in test env)
    // ─────────────────────────────────────────────────────────────────────────
    public function test_ai_document_check_endpoint_exists(): void
    {
        $file = UploadedFile::fake()->create('mykad.jpg', 100, 'image/jpeg');

        $response = $this->actingAs($this->officer, 'sanctum')
            ->postJson('/api/ai/document-check', [
                'file'          => $file,
                'document_type' => 'ic_front',
            ]);

        // Accept 200 (success) or 500 (AI service unavailable in test env)
        $this->assertNotEquals(404, $response->status(), 'Endpoint should exist');
        $this->assertNotEquals(401, $response->status(), 'Endpoint should be authenticated');

        if ($response->status() === 200) {
            $response->assertJsonStructure(['completeness_score', 'extracted_fields', 'classification']);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Unauthenticated access → 401
    // ─────────────────────────────────────────────────────────────────────────
    public function test_unauthenticated_access_returns_401(): void
    {
        $response = $this->getJson('/api/applications');
        $response->assertStatus(401);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Applications list is paginated
    // ─────────────────────────────────────────────────────────────────────────
    public function test_applications_list_is_paginated(): void
    {
        $this->makeApplication(['ic_no' => '850101-14-0001']);
        $this->makeApplication(['ic_no' => '850101-14-0002']);
        $this->makeApplication(['ic_no' => '850101-14-0003']);

        $response = $this->actingAs($this->officer, 'sanctum')
            ->getJson('/api/applications');

        $response->assertStatus(200)
            ->assertJsonStructure(['data', 'total', 'per_page']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Submit application triggers eligibility check
    // ─────────────────────────────────────────────────────────────────────────
    public function test_submit_application_triggers_eligibility_check(): void
    {
        $app = $this->makeApplication([
            'ic_no' => '850101-14-5678',
            'dob'   => '1985-01-01',
        ]);

        // Upload required documents
        Document::create([
            'application_id'  => $app->id,
            'type'            => 'ic_front',
            'original_name'   => 'mykad.jpg',
            'storage_path'    => 'test/mykad.jpg',
            'mime_type'       => 'image/jpeg',
            'file_size_bytes' => 100,
            'status'          => 'verified',
            'ai_confidence'   => 90,
            'uploaded_by'     => $this->officer->id,
        ]);
        Document::create([
            'application_id'  => $app->id,
            'type'            => 'bank_statement',
            'original_name'   => 'bank.pdf',
            'storage_path'    => 'test/bank.pdf',
            'mime_type'       => 'application/pdf',
            'file_size_bytes' => 200,
            'status'          => 'verified',
            'ai_confidence'   => 88,
            'uploaded_by'     => $this->officer->id,
        ]);

        $response = $this->actingAs($this->officer, 'sanctum')
            ->postJson("/api/applications/{$app->id}/submit");

        // Should return 200 with eligibility result or 422 for validation
        $this->assertContains($response->status(), [200, 422]);
        if ($response->status() === 200) {
            $response->assertJsonStructure(['application', 'auto_rejected']);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Delete application (soft delete) → 200
    // ─────────────────────────────────────────────────────────────────────────
    public function test_delete_application_returns_200(): void
    {
        $app = $this->makeApplication();

        $response = $this->actingAs($this->officer, 'sanctum')
            ->deleteJson("/api/applications/{$app->id}");

        $response->assertStatus(200)
            ->assertJsonStructure(['message']);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Check eligibility endpoint → 200
    // ─────────────────────────────────────────────────────────────────────────
    public function test_check_eligibility_endpoint_returns_200(): void
    {
        $app = $this->makeApplication(['ic_no' => '850101-14-9999']);

        $response = $this->actingAs($this->officer, 'sanctum')
            ->getJson("/api/applications/{$app->id}/check-eligibility");

        $response->assertStatus(200)
            ->assertJsonStructure(['eligible', 'checks']);
    }
}
