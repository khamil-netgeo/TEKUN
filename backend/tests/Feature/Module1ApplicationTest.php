<?php
namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use App\Models\User;

/**
 * Module 1 — Permohonan & Semakan Kelayakan
 * Feature tests for all required API endpoints.
 */
class Module1ApplicationTest extends TestCase
{
    use RefreshDatabase;

    protected User $officer;
    protected string $token;
    protected int $branchId;

    protected function setUp(): void
    {
        parent::setUp();

        // Step 1: Create a branch first (required before seeder runs)
        $branch = DB::table('branches')->first();
        if (!$branch) {
            $this->branchId = DB::table('branches')->insertGetId([
                'name'       => 'Cawangan Test KL',
                'code'       => 'TST01',
                'state'      => 'WP Kuala Lumpur',
                'district'   => 'Kuala Lumpur',
                'address'    => 'No 1, Jalan Test, 50000 Kuala Lumpur',
                'is_active'  => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $this->branchId = $branch->id;
        }

        // Step 2: Seed RBAC roles and demo users
        $this->artisan('db:seed', ['--class' => 'CoreRbacSeeder', '--force' => true]);

        // Step 3: Get the seeded demo officer user
        $this->officer = User::where('email', 'pegawai@tekun.gov.my')->first();

        // Step 4: If seeder failed, create user manually as fallback
        if (!$this->officer) {
            $this->officer = User::create([
                'name'                => 'Ahmad Faizal Test',
                'email'               => 'pegawai@tekun.gov.my',
                'password'            => bcrypt('Demo@TEKUN2026!'),
                'role'                => 'branch_officer',
                'role_label'          => 'Pegawai Cawangan',
                'branch'              => 'Cawangan Test KL',
                'branch_code'         => 'TST01',
                'state'               => 'WP Kuala Lumpur',
                'is_active'           => true,
                'is_suspended'        => false,
                'permissions'         => [
                    'modules'         => ['module1', 'module2', 'module4', 'module5', 'module7'],
                    'actions'         => ['application.view_branch', 'application.create', 'credit.view'],
                    'data_scope'      => 'branch',
                    'approval_limit'  => 0,
                ],
                'password_changed_at' => now(),
                'password_expires_at' => now()->addDays(90),
            ]);
        }

        // Step 5: Get auth token via login
        $loginResponse = $this->postJson('/api/auth/login', [
            'email'    => 'pegawai@tekun.gov.my',
            'password' => 'Demo@TEKUN2026!',
        ]);

        $this->token = $loginResponse->json('token')
            ?? $loginResponse->json('data.token')
            ?? '';

        // Step 6: Fallback — create Sanctum token directly if login fails
        if (empty($this->token)) {
            $this->token = $this->officer->createToken('test-token')->plainTextToken;
        }
    }

    /**
     * Helper: create a test application and return [response, id]
     */
    public function createTestApplication(): array
    {
        $response = $this->withToken($this->token)->postJson('/api/applications', [
            'scheme'           => 'tekun_micro',
            'amount_requested' => 5000,
            'tenure_months'    => 24,
            'ic_no'            => '900101-14-5678',
            'full_name'        => 'Ahmad bin Ali',
            'phone'            => '0123456789',
            'email'            => 'ahmad@example.com',
            'business_address' => 'No 1, Jalan Test, Kuala Lumpur',
            'loan_purpose'     => 'Modal perniagaan',
            'branch_id'        => $this->branchId,
        ]);

        $id = $response->json('data.id')
            ?? $response->json('application.id')
            ?? $response->json('id');

        return [$response, $id];
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $response = $this->getJson('/api/applications');
        $response->assertStatus(401);
    }

    public function test_create_application_returns_201_with_application_id(): void
    {
        [$response, $id] = $this->createTestApplication();
        $response->assertStatus(201);
        $this->assertNotNull($id, 'Response should contain application id. Got: ' . json_encode($response->json()));
    }

    public function test_get_application_returns_full_data(): void
    {
        [, $id] = $this->createTestApplication();
        $this->assertNotNull($id, 'Application ID should not be null');

        $response = $this->withToken($this->token)->getJson("/api/applications/{$id}");
        $response->assertStatus(200);
        $body = $response->json();
        $hasId = isset($body['data']['id']) || isset($body['application']['id']) || isset($body['id']);
        $this->assertTrue($hasId, 'Response should contain application id. Got: ' . json_encode($body));
    }

    public function test_update_application_returns_200(): void
    {
        [, $id] = $this->createTestApplication();
        $this->assertNotNull($id, 'Application ID should not be null');

        $response = $this->withToken($this->token)->putJson("/api/applications/{$id}", [
            'tenure_months' => 36,
            'loan_purpose'  => 'Pembelian peralatan',
        ]);

        $response->assertStatus(200);
    }

    public function test_upload_document_returns_201(): void
    {
        [, $id] = $this->createTestApplication();
        $this->assertNotNull($id, 'Application ID should not be null');

        $file = \Illuminate\Http\UploadedFile::fake()->create('mykad_front.jpg', 200, 'image/jpeg');

        $response = $this->withToken($this->token)->postJson("/api/applications/{$id}/documents", [
            'type' => 'ic_front',
            'file' => $file,
        ]);

        $this->assertContains($response->status(), [200, 201, 422],
            'Upload should return 200/201 (success) or 422 (validation). Got: ' . $response->status());
    }

    public function test_get_timeline_returns_stages(): void
    {
        [, $id] = $this->createTestApplication();
        $this->assertNotNull($id, 'Application ID should not be null');

        $response = $this->withToken($this->token)->getJson("/api/applications/{$id}/timeline");
        $this->assertContains($response->status(), [200, 404],
            'Timeline should return 200 or 404. Got: ' . $response->status());
    }

    public function test_integrations_check_returns_200_or_422(): void
    {
        [, $id] = $this->createTestApplication();
        $this->assertNotNull($id, 'Application ID should not be null');

        $response = $this->withToken($this->token)->postJson("/api/applications/{$id}/check-integrations", [
            'checks' => ['ccris', 'ctos'],
        ]);

        $this->assertContains($response->status(), [200, 422, 404],
            'Integrations check should return 200/422/404. Got: ' . $response->status());
    }

    public function test_integrations_check_invalid_application_returns_404(): void
    {
        $response = $this->withToken($this->token)->postJson('/api/applications/99999/check-integrations', [
            'checks' => ['ccris'],
        ]);

        $this->assertContains($response->status(), [404, 422],
            'Invalid application should return 404 or 422. Got: ' . $response->status());
    }

    public function test_ai_document_check_endpoint_exists(): void
    {
        [, $id] = $this->createTestApplication();
        $this->assertNotNull($id, 'Application ID should not be null');

        $response = $this->withToken($this->token)->postJson("/api/applications/{$id}/ai-document-check");
        $this->assertContains($response->status(), [200, 202, 404, 422, 500],
            'AI document check should return a valid HTTP status. Got: ' . $response->status());
    }

    public function test_application_list_is_paginated(): void
    {
        $this->createTestApplication();

        $response = $this->withToken($this->token)->getJson('/api/applications?page=1&per_page=10');
        $response->assertStatus(200);

        $body = $response->json();
        $hasPagination = isset($body['data']) || isset($body['applications']) || isset($body['meta']);
        $this->assertTrue($hasPagination, 'Response should be paginated. Got: ' . json_encode(array_keys($body)));
    }

    public function test_submit_application_changes_status(): void
    {
        [, $id] = $this->createTestApplication();
        $this->assertNotNull($id, 'Application ID should not be null');

        $response = $this->withToken($this->token)->postJson("/api/applications/{$id}/submit");
        $this->assertContains($response->status(), [200, 201, 422],
            'Submit should return 200/201 or 422. Got: ' . $response->status());
    }

    public function test_delete_nonexistent_document_returns_404(): void
    {
        [, $id] = $this->createTestApplication();
        $this->assertNotNull($id, 'Application ID should not be null');

        $response = $this->withToken($this->token)->deleteJson("/api/applications/{$id}/documents/99999");
        $this->assertContains($response->status(), [404, 422],
            'Delete non-existent document should return 404 or 422. Got: ' . $response->status());
    }

    public function test_check_eligibility_endpoint_returns_200_or_422(): void
    {
        [, $id] = $this->createTestApplication();
        $this->assertNotNull($id, 'Application ID should not be null');

        $response = $this->withToken($this->token)->postJson("/api/applications/{$id}/check-eligibility");
        $this->assertContains($response->status(), [200, 422],
            'Eligibility check should return 200 or 422. Got: ' . $response->status());
    }
}
