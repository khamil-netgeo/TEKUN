<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

/**
 * Module 10 — Integration API Tests
 * Uses sppt_db (production DB) via phpunit.xml env override.
 * Self-seeds if DB is empty.
 */
class IntegrationApiTest extends TestCase
{
    use WithFaker;

    private string $token = '';
    private ?User $adminUser = null;
    private ?User $pegawaiUser = null;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed users if empty
        if (User::count() === 0) {
            $this->artisan('db:seed', ['--class' => 'CoreRbacSeeder', '--force' => true]);
        }

        // Seed M10 integrations if empty
        if (\DB::table('api_integrations')->count() === 0) {
            \DB::table('api_integrations')->insert([
                ['service_key' => 'esyariah', 'service_name' => 'e-Syariah', 'description' => 'Portal e-Syariah', 'base_url' => 'https://esyariah.gov.my', 'circuit_breaker_state' => 'CLOSED', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['service_key' => 'muflis', 'service_name' => 'Muflis (MDI)', 'description' => 'Jabatan Insolvensi Malaysia', 'base_url' => 'https://www.mdi.gov.my', 'circuit_breaker_state' => 'CLOSED', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['service_key' => 'ssm', 'service_name' => 'SSM', 'description' => 'Suruhanjaya Syarikat Malaysia', 'base_url' => 'https://www.ssm.com.my', 'circuit_breaker_state' => 'CLOSED', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['service_key' => 'ccris', 'service_name' => 'CCRIS (BNM)', 'description' => 'Central Credit Reference Information System', 'base_url' => 'https://www.bnm.gov.my', 'circuit_breaker_state' => 'HALF_OPEN', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['service_key' => 'ctos', 'service_name' => 'CTOS', 'description' => 'CTOS Data Systems', 'base_url' => 'https://www.ctosdata.com', 'circuit_breaker_state' => 'CLOSED', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['service_key' => 'mykad', 'service_name' => 'MyKad / eKYC (JPN)', 'description' => 'Jabatan Pendaftaran Negara eKYC', 'base_url' => 'https://www.jpn.gov.my', 'circuit_breaker_state' => 'CLOSED', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }

        $this->adminUser   = User::where('email', 'admin@tekun.gov.my')->first();
        $this->pegawaiUser = User::where('email', 'pegawai@tekun.gov.my')->first();

        if ($this->adminUser) {
            $this->token = $this->adminUser->createToken('m10-test-token')->plainTextToken;
        }
    }

    protected function tearDown(): void
    {
        if ($this->adminUser) {
            $this->adminUser->tokens()->where('name', 'm10-test-token')->delete();
        }
        parent::tearDown();
    }

    private function authHeaders(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->token,
            'Accept'        => 'application/json',
        ];
    }

    public function test_health_endpoint_returns_all_6_apis(): void
    {
        if (!$this->adminUser) {
            $this->markTestSkipped('Admin user not seeded in DB.');
        }

        $response = $this->getJson('/api/integrations/health', $this->authHeaders());

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'summary' => ['total', 'ok', 'degraded', 'down', 'avg_latency_ms', 'avg_uptime_30d', 'checked_at'],
                     'integrations',
                 ]);

        $this->assertCount(6, $response->json('integrations'));
        $this->assertTrue($response->json('success'));
    }

    public function test_metrics_endpoint_returns_service_data(): void
    {
        if (!$this->adminUser) {
            $this->markTestSkipped('Admin user not seeded in DB.');
        }

        $response = $this->getJson('/api/integrations/esyariah/metrics', $this->authHeaders());

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => ['service', 'latency_24h', 'uptime_30d', 'stats'],
                 ]);
    }

    public function test_metrics_returns_404_for_unknown_service(): void
    {
        if (!$this->adminUser) {
            $this->markTestSkipped('Admin user not seeded in DB.');
        }

        $response = $this->getJson('/api/integrations/unknown-service-xyz/metrics', $this->authHeaders());
        $response->assertStatus(404);
    }

    public function test_test_endpoint_triggers_live_test(): void
    {
        if (!$this->adminUser) {
            $this->markTestSkipped('Admin user not seeded in DB.');
        }

        $response = $this->postJson('/api/integrations/ssm/test', [], $this->authHeaders());

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'result' => ['success', 'latency_ms', 'status', 'service_key', 'tested_at'],
                 ]);
    }

    public function test_alerts_endpoint_returns_configs(): void
    {
        if (!$this->adminUser) {
            $this->markTestSkipped('Admin user not seeded in DB.');
        }

        $response = $this->getJson('/api/integrations/alerts', $this->authHeaders());

        $response->assertStatus(200)
                 ->assertJsonStructure(['success', 'data']);
    }

    public function test_update_alerts_forbidden_for_pegawai(): void
    {
        if (!$this->pegawaiUser) {
            $this->markTestSkipped('Pegawai user not seeded in DB.');
        }

        $pegawaiToken = $this->pegawaiUser->createToken('m10-test-pegawai')->plainTextToken;

        $response = $this->putJson('/api/integrations/alerts', [
            'configs' => [
                ['alert_type' => 'latency', 'latency_threshold_ms' => 1000, 'is_active' => true],
            ],
        ], [
            'Authorization' => 'Bearer ' . $pegawaiToken,
            'Accept'        => 'application/json',
        ]);

        $response->assertStatus(403);
        $this->pegawaiUser->tokens()->where('name', 'm10-test-pegawai')->delete();
    }

    public function test_update_alerts_succeeds_for_admin(): void
    {
        if (!$this->adminUser) {
            $this->markTestSkipped('Admin user not seeded in DB.');
        }

        $response = $this->putJson('/api/integrations/alerts', [
            'configs' => [
                [
                    'service_key'                => 'global',
                    'alert_type'                 => 'latency',
                    'latency_threshold_ms'       => 2000,
                    'downtime_threshold_minutes' => 10,
                    'error_rate_threshold'       => 15,
                    'notify_email'               => true,
                    'notify_sms'                 => false,
                    'is_active'                  => true,
                ],
            ],
        ], $this->authHeaders());

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $response = $this->getJson('/api/integrations/health');
        $response->assertStatus(401);
    }

    public function test_circuit_breaker_reset_requires_auth(): void
    {
        $response = $this->postJson('/api/integrations/esyariah/circuit-breaker/reset');
        $response->assertStatus(401);
    }

    public function test_logs_endpoint_returns_data(): void
    {
        if (!$this->adminUser) {
            $this->markTestSkipped('Admin user not seeded in DB.');
        }

        $response = $this->getJson('/api/integrations/logs', $this->authHeaders());

        $response->assertStatus(200)
                 ->assertJsonStructure(['success', 'data']);
    }
}