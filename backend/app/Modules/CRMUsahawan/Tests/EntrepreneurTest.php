<?php

namespace App\Modules\CRMUsahawan\Tests;

use Tests\TestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use App\Models\User;

/**
 * Module 7 — CRM & Pemantauan Usahawan
 * EntrepreneurTest — API endpoint tests
 */
class EntrepreneurTest extends TestCase
{
    use DatabaseTransactions;

    private function getAuthToken(): string
    {
        $user = User::factory()->create();
        $user->assignRole('Pentadbir Sistem');
        return $user->createToken('test')->plainTextToken;
    }

    public function test_entrepreneurs_list_returns_200(): void
    {
        $token = $this->getAuthToken();

        $response = $this->withToken($token)->getJson('/api/entrepreneurs');

        $response->assertStatus(200)
                 ->assertJsonStructure(['data', 'total', 'current_page', 'last_page']);
    }

    public function test_entrepreneurs_list_requires_auth(): void
    {
        $response = $this->getJson('/api/entrepreneurs');
        $response->assertStatus(401);
    }

    public function test_entrepreneur_show_returns_404_for_unknown(): void
    {
        $token = $this->getAuthToken();

        $response = $this->withToken($token)->getJson('/api/entrepreneurs/USH-9999');
        $response->assertStatus(404);
    }

    public function test_ai_health_endpoint_returns_404_for_unknown(): void
    {
        $token = $this->getAuthToken();

        $response = $this->withToken($token)->getJson('/api/ai/entrepreneur-health/9999');
        $response->assertStatus(404);
    }

    public function test_visit_report_returns_404_for_unknown_visit(): void
    {
        $token = $this->getAuthToken();

        $response = $this->withToken($token)->postJson('/api/entrepreneurs/visits/9999/report');
        $response->assertStatus(404);
    }
}
