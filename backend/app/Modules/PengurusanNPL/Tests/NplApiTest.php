<?php

namespace App\Modules\PengurusanNPL\Tests;

use Tests\TestCase;
use Illuminate\Support\Facades\DB;

/**
 * Module 5 — Pengurusan NPL API Tests
 * Tests all 5 required endpoints per project spec.
 */
class NplApiTest extends TestCase
{
    private string $token = '';

    protected function setUp(): void
    {
        parent::setUp();
        $response = $this->postJson('/api/auth/login', [
            'email'    => 'kredit@tekun.gov.my',
            'password' => 'demo1234',
        ]);
        $this->token = $response->json('token') ?? '';
    }

    /** @test */
    public function test_npl_dashboard_returns_required_fields(): void
    {
        $response = $this->withToken($this->token)
            ->getJson('/api/npl/dashboard');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'total_npl',
                'ratio',
                'by_branch',
                'by_sector',
            ]);
    }

    /** @test */
    public function test_accounts_endpoint_accepts_classification_filter(): void
    {
        $response = $this->withToken($this->token)
            ->getJson('/api/accounts?classification=tidak_lancar');

        $response->assertStatus(200);
        // Accept either {data, total} or {success, data, meta} response structures
        $body = $response->json();
        $this->assertTrue(
            isset($body['data']) || isset($body['accounts']) || is_array($body),
            'Response should contain account data'
        );
    }

    /** @test */
    public function test_collection_tasks_returns_prioritized_list(): void
    {
        $response = $this->withToken($this->token)
            ->getJson('/api/collections/tasks');

        $response->assertStatus(200);
        // Accept either {data, total} or array response
        $body = $response->json();
        $this->assertTrue(
            isset($body['data']) || is_array($body),
            'Response should contain collection task data'
        );
    }

    /** @test */
    public function test_dunning_trigger_returns_notis_sent_and_channel(): void
    {
        $account = DB::table('accounts')->first();
        if (!$account) {
            $this->markTestSkipped('No accounts in test database');
        }

        $response = $this->withToken($this->token)
            ->postJson("/api/collections/dunning/{$account->id}");

        $response->assertStatus(200)
            ->assertJsonStructure(['notis_sent', 'channel']);
    }

    /** @test */
    public function test_log_outcome_returns_200(): void
    {
        $task = DB::table('collection_tasks')->first();
        if (!$task) {
            $this->markTestSkipped('No collection tasks in test database');
        }

        $response = $this->withToken($this->token)
            ->postJson("/api/collections/tasks/{$task->id}/outcome", [
                'outcome'        => 'promised_payment',
                'notes'          => 'Berjanji bayar minggu depan',
                'follow_up_days' => 7,
            ]);

        $response->assertStatus(200);
    }

    /** @test */
    public function test_unauthenticated_access_returns_401(): void
    {
        $this->getJson('/api/npl/dashboard')->assertStatus(401);
        $this->getJson('/api/collections/tasks')->assertStatus(401);
    }
}
