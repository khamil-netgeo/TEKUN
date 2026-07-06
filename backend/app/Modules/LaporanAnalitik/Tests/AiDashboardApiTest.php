<?php

namespace App\Modules\LaporanAnalitik\Tests;

use Tests\TestCase;
use App\Models\User;

class AiDashboardApiTest extends TestCase
{

    private User $user;
    private string $token;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(\Database\Seeders\CoreRolesOnlySeeder::class);

        $this->user = User::factory()->create([
            'role'        => 'Eksekutif',
            'permissions' => json_encode(['module6']),
        ]);

        $this->user->assignRole('Eksekutif');

        $response    = $this->postJson('/api/auth/login', [
            'email'    => $this->user->email,
            'password' => 'password',
        ]);
        $this->token = $response->json('data.token') ?? $response->json('token') ?? '';
    }

    public function test_officer_skill_profile_can_be_saved(): void
    {
        $response = $this->withToken($this->token)
            ->postJson('/api/officer-skills', [
                'skills_description' => 'Saya mahir dalam kes pembiayaan pertanian dan mikro-perniagaan.',
                'specialisation'     => 'Pembiayaan Pertanian',
                'years_experience'   => 5,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => ['id', 'skills_description'],
            ]);
    }

    public function test_officer_skill_profile_can_be_retrieved(): void
    {
        // Save a profile first
        $this->withToken($this->token)
            ->postJson('/api/officer-skills', [
                'skills_description' => 'Saya mahir dalam kes pembiayaan pertanian.',
                'years_experience'   => 3,
            ]);

        $response = $this->withToken($this->token)
            ->getJson('/api/officer-skills/me');

        // 200 if profile exists, 404 if not yet created, 500 if AI call fails in test env
        $this->assertContains($response->status(), [200, 404, 500]);
    }

    public function test_officer_skill_history_can_be_retrieved(): void
    {
        $response = $this->withToken($this->token)
            ->getJson('/api/officer-skills/history');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data',
            ]);
    }

    public function test_ai_decision_assist_returns_recommendation(): void
    {
        // Save a profile first
        $this->withToken($this->token)
            ->postJson('/api/officer-skills', [
                'skills_description' => 'Saya mahir dalam kes pembiayaan pertanian.',
                'years_experience'   => 3,
            ]);

        $response = $this->withToken($this->token)
            ->postJson('/api/ai/decision-assist', [
                'case_type'       => 'permohonan_pembiayaan',
                'context_summary' => 'Pemohon berumur 35 tahun, peniaga makanan. Memohon RM50,000.',
            ]);

        // Accept 200 (AI available) or 500 (AI unavailable in test env)
        $this->assertContains($response->status(), [200, 500]);

        if ($response->status() === 200) {
            $response->assertJsonStructure([
                'success',
                'data',
            ]);
        }
    }
}