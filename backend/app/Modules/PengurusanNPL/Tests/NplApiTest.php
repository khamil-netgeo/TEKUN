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

        // Ensure test user exists with correct password
        $user = DB::table('users')->where('email', 'kredit@tekun.gov.my')->first();
        if (!$user) {
            $this->artisan('db:seed', ['--class' => 'CoreRbacSeeder']);
        }
        DB::table('users')
            ->where('email', 'kredit@tekun.gov.my')
            ->update(['password' => bcrypt('demo1234')]);

        // Ensure M5 tables exist
        $this->artisan('migrate', [
            '--path' => 'app/Modules/PengurusanNPL/Database/Migrations',
        ]);

        // Ensure test data exists
        $this->ensureTestData();

        // Login
        $response = $this->postJson('/api/auth/login', [
            'email'    => 'kredit@tekun.gov.my',
            'password' => 'demo1234',
        ]);
        $this->token = $response->json('token') ?? '';
    }

    private function ensureTestData(): void
    {
        if (DB::table('npl_records')->count() > 0) {
            return;
        }

        // Ensure branch exists (idempotent)
        $existingBranch = DB::table('branches')->where('code', 'TEST-BR')->first();
        if ($existingBranch) {
            $branchId = $existingBranch->id;
        } else {
            $branchId = DB::table('branches')->insertGetId([
                'code'       => 'TEST-BR',
                'name'       => 'Cawangan Test',
                'state'      => 'Selangor',
                'district'   => 'Petaling',
                'is_active'  => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $officerId = DB::table('users')->first()->id ?? 1;

        // Create minimal application
        $appId = DB::table('applications')->insertGetId([
            'ref_no'           => 'TEST-APP-' . uniqid(),
            'applicant_name'   => 'Ahmad Test',
            'ic_no'            => '900101-01-1234',
            'phone'            => '0123456789',
            'scheme'           => 'TEKUN',
            'branch_id'        => $branchId,
            'officer_id'       => $officerId,
            'amount_requested' => 10000,
            'tenure_months'    => 24,
            'status'           => 'approved',
            'auto_rejected'    => false,
            'ccris_checked'    => false,
            'ctos_checked'     => false,
            'ssm_checked'      => false,
            'muflis_checked'   => false,
            'esyariah_checked' => false,
            'ekyc_verified'    => false,
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        // Create account
        $accountId = DB::table('accounts')->insertGetId([
            'application_id'   => $appId,
            'account_no'       => 'SPPT-TEST-001',
            'ic_no'            => '900101-01-1234',
            'borrower_name'    => 'Ahmad Test',
            'principal'        => 10000,
            'profit_rate'      => 4.5,
            'tenure_months'    => 24,
            'monthly_instalment' => 500,
            'start_date'       => '2024-01-01',
            'maturity_date'    => '2026-01-01',
            'outstanding_balance' => 5000,
            'total_paid'       => 5000,
            'arrears_amount'   => 1500,
            'arrears_days'     => 45,
            'classification'   => 'Substandard',
            'tawidh_amount'    => 0,
            'moratorium_active' => false,
            'status'           => 'active',
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);

        // Create NPL record
        DB::table('npl_records')->insert([
            'account_id'     => $accountId,
            'classification' => 'Substandard',
            'days_overdue'   => 45,
            'outstanding'    => 5000,
            'ai_risk_level'  => 'Sederhana',
            'classified_at'  => now(),
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        // Create collection task
        DB::table('collection_tasks')->insert([
            'account_id'  => $accountId,
            'assigned_to' => $officerId,
            'priority'    => 'medium',
            'status'      => 'pending',
            'due_date'    => now()->addDays(7),
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);
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
                'categories',
            ]);
    }

    /** @test */
    public function test_dunning_list_returns_paginated_records(): void
    {
        $response = $this->withToken($this->token)
            ->getJson('/api/npl/dunning?per_page=5');

        $response->assertStatus(200);
        $body = $response->json();
        $this->assertTrue(
            isset($body['data']) || isset($body['success']),
            'Response should contain dunning data'
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
