<?php

namespace App\Modules\LaporanAnalitik\Tests;

use App\Models\User;
use Tests\TestCase;
use Spatie\Permission\Models\Role;

/**
 * Module 6 — Dashboard & Analitik Feature Tests
 *
 * Uses DatabaseTransactions (not RefreshDatabase) to avoid re-running
 * the knowledge_base migration which requires pgvector HNSW > 2000 dims.
 * All test data is rolled back after each test.
 */
class DashboardApiTest extends TestCase
{
    private User $user;
    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        // Make sure roles exist before assigning
        if (!Role::where('name', 'Eksekutif')->exists()) {
            $this->seed(\Database\Seeders\CoreRolesOnlySeeder::class);
        }

        $this->user = User::factory()->create([
            'email'      => 'eksekutif.m6test@tekun.gov.my',
            'password'   => bcrypt('demo1234'),
            'role'       => 'executive',
            'role_label' => 'Eksekutif',
            'permissions' => [
                'modules' => ['module6'],
                'approval_limit' => 0,
            ],
        ]);

        // Assign the appropriate role for dashboard/analytics tests
        $this->user->assignRole('Eksekutif');

        $response = $this->postJson('/api/auth/login', [
            'email'    => 'eksekutif.m6test@tekun.gov.my',
            'password' => 'demo1234',
        ]);

        $this->token = $response->json('data.token') ?? $response->json('token') ?? '';
    }

    public function test_kpi_endpoint_returns_required_fields(): void
    {
        $response = $this->withToken($this->token)
            ->getJson('/api/dashboard/kpi');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'total_portfolio',
                    'approval_rate',
                    'npl_ratio',
                    'disbursement_volume',
                    'collection_rate',
                    'total_applications',
                    'active_accounts',
                    'as_of',
                ],
            ]);

        $this->assertTrue($response->json('success'));
    }

    public function test_trends_endpoint_returns_time_series(): void
    {
        $response = $this->withToken($this->token)
            ->getJson('/api/dashboard/trends?period=monthly');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'period',
                    'disbursement',
                    'collection',
                    'npl_trend',
                    'applications',
                ],
            ]);
    }

    public function test_branch_performance_endpoint(): void
    {
        $response = $this->withToken($this->token)
            ->getJson('/api/dashboard/branch-performance');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'branches',
                    'state_heatmap',
                    'summary',
                ],
            ]);

        $branches = $response->json('data.branches');
        $this->assertNotEmpty($branches);
        $this->assertArrayHasKey('rank', $branches[0]);
        $this->assertArrayHasKey('branch_name', $branches[0]);
    }
}