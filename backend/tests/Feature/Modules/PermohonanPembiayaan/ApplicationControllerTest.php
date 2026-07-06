<?php

namespace Tests\Feature\Modules\PermohonanPembiayaan;

use App\Models\Branch;
use App\Models\User;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Module 1 — Permohonan & Semakan Kelayakan
 * Feature tests for ApplicationController endpoints.
 */
class ApplicationControllerTest extends TestCase
{

    private User $user;
    private string $token;
    private Branch $branch;

    /** Minimal valid application payload matching StoreApplicationRequest rules */
    private array $validPayload = [
        'scheme'           => 'tekun_usahawan',
        'amount_requested' => 30000,
        'tenure_months'    => 36,
        'ic_no'            => '900101-14-5678',
        'full_name'        => 'Ahmad bin Ali',
        'phone'            => '0123456789',
        'email'            => 'ahmad@example.com',
        'business_name'    => 'Kedai Maju',
        'business_type'    => 'retail',
        'business_address' => 'No. 1, Jalan Maju, 50000 Kuala Lumpur',
        'loan_purpose'         => 'Perluasan perniagaan ke premis baru',
        'business_age_months' => 12,
    ];

    protected function setUp(): void
    {
        parent::setUp();
        $this->branch = Branch::create([
            'code'         => 'CW-TEST',
            'name'         => 'Cawangan Test',
            'state'        => 'Selangor',
            'district'     => 'Petaling',
            'address'      => 'No. 1, Jalan Test',
            'phone'        => '0312345678',
            'email'        => 'cawangan.test@tekun.gov.my',
            'manager_name' => 'Pengurus Test',
            'is_active'    => true,
        ]);
        
        $this->user = User::factory()->create([
            'is_active' => true,
            'permissions' => [
                'modules'        => ['module1', 'module2', 'module3'],
                'actions'        => ['application.create', 'application.view'],
                'data_scope'     => 'branch',
                'approval_limit' => 0,
            ],
            'branch_code' => 'CW-TEST',
        ]);

        try {
            $this->user->assignRole('Pegawai Cawangan');
        } catch (\Exception $e) {
            // Role might not exist, ignore for tests
        }

        $this->token = $this->user->createToken('test')->plainTextToken;
        // Add branch_id to payload now that branch exists
        $this->validPayload['branch_id'] = $this->branch->id;
    }

    #[Test]
    public function unauthenticated_cannot_access_applications(): void
    {
        $this->getJson('/api/applications')->assertStatus(401);
    }

    #[Test]
    public function authenticated_user_can_list_applications(): void
    {
        $response = $this->withToken($this->token)
             ->getJson('/api/applications')
             ->assertStatus(200);

        // Response must have a 'data' key (paginated list)
        $response->assertJsonStructure(['data']);
    }

    #[Test]
    public function can_create_application(): void
    {
        $this->withToken($this->token)
             ->postJson('/api/applications', $this->validPayload)
             ->assertStatus(201);
    }
}