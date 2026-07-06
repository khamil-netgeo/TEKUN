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

    public function test_can_list_integrations()
    {
        $this->withoutExceptionHandling();

        $response = $this->getJson('/api/v1/integrations', $this->authHeaders());

        $response->assertStatus(200);
    }

    public function test_can_get_integration_details()
    {
        $this->withoutExceptionHandling();

        $integration = \DB::table('api_integrations')->first();

        $response = $this->getJson('/api/v1/integrations/' . $integration->id, $this->authHeaders());

        $response->assertStatus(200);
    }
}