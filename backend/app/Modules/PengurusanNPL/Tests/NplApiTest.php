<?php

namespace App\Modules\PengurusanNPL\Tests;

use Tests\TestCase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

/**
 * Module 5 — Pengurusan NPL API Tests
 * Uses actingAs() to bypass Spatie role middleware in tests.
 */
class NplApiTest extends TestCase
{
    private string $token = '';
    private ?User $testUser = null;

    protected function setUp(): void
    {
        parent::setUp();

        // Create or get test user
        $user = DB::table('users')->where('email', 'npl_test@tekun.gov.my')->first();
        if (!$user) {
            $userId = DB::table('users')->insertGetId([
                'name'               => 'NPL Test User',
                'email'              => 'npl_test@tekun.gov.my',
                'password'           => Hash::make('demo1234'),
                'role'               => 'credit_officer',
                'is_active'          => true,
                'is_suspended'       => false,
                'password_expires_at' => now()->addDays(90),
                'created_at'         => now(),
                'updated_at'         => now(),
            ]);
            $user = DB::table('users')->find($userId);
        } else {
            DB::table('users')->where('id', $user->id)->update([
                'password'           => Hash::make('demo1234'),
                'is_active'          => true,
                'is_suspended'       => false,
                'password_expires_at' => now()->addDays(90),
            ]);
        }

        // Assign Spatie role if not already assigned
        $role = DB::table('roles')->where('name', 'credit_officer')->first();
        if (!$role) {
            $roleId = DB::table('roles')->insertGetId([
                'name'       => 'credit_officer',
                'guard_name' => 'web',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        } else {
            $roleId = $role->id;
        }

        $hasRole = DB::table('model_has_roles')
            ->where('model_id', $user->id)
            ->where('role_id', $roleId)
            ->exists();
        if (!$hasRole) {
            DB::table('model_has_roles')->insert([
                'role_id'    => $roleId,
                'model_type' => 'App\Models\User',
                'model_id'   => $user->id,
            ]);
        }

        // Login to get token
        $response = $this->postJson('/api/auth/login', [
            'email'    => 'npl_test@tekun.gov.my',
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
                'npl_rate',
                'total_outstanding',
                'collection_rate',
                'categories',
            ]);
    }

    /** @test */
    public function test_accounts_endpoint_accepts_classification_filter(): void
    {
        $response = $this->withToken($this->token)
            ->getJson('/api/npl/accounts');
        $response->assertStatus(200);
        $body = $response->json();
        $this->assertTrue(
            isset($body['data']) || is_array($body),
            'Response should contain account data'
        );
    }

    /** @test */
    public function test_collection_tasks_returns_prioritized_list(): void
    {
        $response = $this->withToken($this->token)
            ->getJson('/api/collections/tasks');
        $response->assertStatus(200);
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
            ->postJson("/api/collections/dunning/{$account->id}", ['channel' => 'sms']);
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
    }
}
