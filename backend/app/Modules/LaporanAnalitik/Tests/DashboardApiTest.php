<?php

namespace App\Modules\LaporanAnalitik\Tests;

use App\Models\User;
use Tests\TestCase;

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
        $this->assertArrayHasKey('collection_rate', $branches[0]);
        $this->assertArrayHasKey('npl_ratio', $branches[0]);
    }

    public function test_predictive_analytics_endpoint(): void
    {
        $response = $this->withToken($this->token)
            ->getJson('/api/dashboard/predictive');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'forecast_period',
                    'forecast',
                    'risk_alerts',
                    'predicted_npl_q3',
                    'predicted_collection_q3',
                    'ai_confidence',
                ],
            ]);
    }

    public function test_report_builder_endpoint(): void
    {
        $response = $this->withToken($this->token)
            ->getJson('/api/reports/builder?columns[]=nama&columns[]=skim&from=2026-01-01&to=2026-07-31');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'data',
                    'total_records',
                    'columns_used',
                ],
            ]);
    }

    public function test_report_export_endpoint(): void
    {
        $response = $this->withToken($this->token)
            ->postJson('/api/reports/export', [
                'columns'     => ['nama', 'skim', 'jumlah'],
                'from'        => '2026-01-01',
                'to'          => '2026-07-31',
                'report_name' => 'Test Laporan',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'report_ref',
                    'report_name',
                    'total_records',
                    'pdf_url',
                    'excel_url',
                    'status',
                ],
            ]);

        $this->assertEquals('completed', $response->json('data.status'));
    }

    public function test_unauthenticated_access_is_rejected(): void
    {
        $this->getJson('/api/dashboard/kpi')
            ->assertStatus(401);
    }
}
