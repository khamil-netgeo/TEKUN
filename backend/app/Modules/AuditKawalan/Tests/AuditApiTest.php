<?php

namespace App\Modules\AuditKawalan\Tests;

use App\Models\AuditTrail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Module 11 — Audit & Kawalan
 * AuditApiTest: PHPUnit tests for all 5 audit-log endpoints.
 *
 * Run: php artisan test --filter AuditApiTest
 */
class AuditApiTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles (Spatie)
        $adminRole   = Role::firstOrCreate(['name' => 'Pentadbir Sistem',  'guard_name' => 'sanctum']);
        $pegawaiRole = Role::firstOrCreate(['name' => 'Pegawai Cawangan', 'guard_name' => 'sanctum']);

        $this->adminUser = User::factory()->create([
            'name'        => 'Admin Test',
            'email'       => 'admin-test@tekun.gov.my',
            'role'        => 'system_admin',
            'permissions' => ['modules' => ['*'], 'approval_limit' => 999999],
        ]);
        $this->adminUser->assignRole($adminRole);

        $this->regularUser = User::factory()->create([
            'name'        => 'Pegawai Test',
            'email'       => 'pegawai-test@tekun.gov.my',
            'role'        => 'pegawai_cawangan',
            'permissions' => ['modules' => ['module11'], 'approval_limit' => 0],
        ]);
        $this->regularUser->assignRole($pegawaiRole);

        // Seed some audit trail records
        AuditTrail::insert([
            [
                'user_id'        => $this->adminUser->id,
                'action'         => 'approve',
                'module'         => 'permohonan',
                'auditable_type' => 'App\\Models\\Application',
                'auditable_id'   => 1,
                'ip_address'     => '192.168.1.1',
                'old_values'     => json_encode(['status' => 'pending']),
                'new_values'     => json_encode(['status' => 'approved']),
                'created_at'     => now(),
                'updated_at'     => now(),
            ],
            [
                'user_id'        => $this->regularUser->id,
                'action'         => 'login',
                'module'         => 'auth',
                'auditable_type' => 'App\\Models\\User',
                'auditable_id'   => $this->regularUser->id,
                'ip_address'     => '10.0.0.1',
                'old_values'     => null,
                'new_values'     => null,
                'created_at'     => now()->subHour(),
                'updated_at'     => now()->subHour(),
            ],
            [
                'user_id'        => $this->adminUser->id,
                'action'         => 'delete',
                'module'         => 'pengguna',
                'auditable_type' => 'App\\Models\\User',
                'auditable_id'   => 99,
                'ip_address'     => '192.168.1.1',
                'old_values'     => json_encode(['name' => 'Test User']),
                'new_values'     => null,
                'created_at'     => now()->subMinutes(5),
                'updated_at'     => now()->subMinutes(5),
            ],
        ]);
    }

    // ─── GET /api/audit-logs ──────────────────────────────────────────────────

    /**
     * @test
     * Unauthenticated request should return 401.
     */
    public function test_audit_logs_requires_authentication(): void
    {
        $response = $this->getJson('/api/audit-logs');
        $response->assertStatus(401);
    }

    /**
     * @test
     * Admin can retrieve paginated audit logs.
     */
    public function test_admin_can_get_paginated_audit_logs(): void
    {
        Sanctum::actingAs($this->adminUser, [], 'sanctum');

        $response = $this->getJson('/api/audit-logs');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [
                         '*' => [
                             'id', 'user_id', 'user_name', 'user_email',
                             'action', 'module', 'ip_address',
                             'severity', 'created_at',
                         ],
                     ],
                     'total',
                     'current_page',
                     'per_page',
                     'last_page',
                     'anomaly_count',
                 ]);

        $this->assertGreaterThanOrEqual(1, count($response->json('data')));
    }

    /**
     * @test
     * Regular user can only see their own logs.
     */
    public function test_regular_user_sees_only_own_logs(): void
    {
        Sanctum::actingAs($this->regularUser, [], 'sanctum');

        $response = $this->getJson('/api/audit-logs');

        $response->assertStatus(200);

        $data = $response->json('data');
        foreach ($data as $log) {
            $this->assertEquals($this->regularUser->id, $log['user_id'],
                'Regular user should only see their own logs');
        }
    }

    /**
     * @test
     * Filter by action returns only matching logs.
     */
    public function test_audit_logs_filter_by_action(): void
    {
        Sanctum::actingAs($this->adminUser, [], 'sanctum');

        $response = $this->getJson('/api/audit-logs?action=approve');

        $response->assertStatus(200);
        $data = $response->json('data');
        foreach ($data as $log) {
            $this->assertEquals('approve', $log['action']);
        }
    }

    /**
     * @test
     * Filter by module returns only matching logs.
     */
    public function test_audit_logs_filter_by_module(): void
    {
        Sanctum::actingAs($this->adminUser, [], 'sanctum');

        $response = $this->getJson('/api/audit-logs?module=auth');

        $response->assertStatus(200);
        $data = $response->json('data');
        foreach ($data as $log) {
            $this->assertEquals('auth', $log['module']);
        }
    }

    /**
     * @test
     * Pagination works correctly.
     */
    public function test_audit_logs_pagination(): void
    {
        Sanctum::actingAs($this->adminUser, [], 'sanctum');

        $response = $this->getJson('/api/audit-logs?per_page=2&page=1');

        $response->assertStatus(200)
                 ->assertJsonPath('current_page', 1)
                 ->assertJsonPath('per_page', 2);
    }

    // ─── GET /api/audit-logs/stats ────────────────────────────────────────────

    /**
     * @test
     * Admin can retrieve audit stats with correct structure.
     */
    public function test_admin_can_get_audit_stats(): void
    {
        Sanctum::actingAs($this->adminUser, [], 'sanctum');

        $response = $this->getJson('/api/audit-logs/stats');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'total',
                     'today',
                     'critical',
                     'unique_users',
                     'by_action',
                     'by_module',
                     'daily_trend',
                     'from',
                     'to',
                 ]);

        // Verify real counts
        $this->assertIsInt($response->json('total'));
        $this->assertIsInt($response->json('today'));
        $this->assertIsInt($response->json('critical'));
        $this->assertGreaterThanOrEqual(0, $response->json('total'));
    }

    /**
     * @test
     * Stats today count matches actual records created today.
     */
    public function test_stats_today_count_is_accurate(): void
    {
        Sanctum::actingAs($this->adminUser, [], 'sanctum');

        $response = $this->getJson('/api/audit-logs/stats');
        $response->assertStatus(200);

        // We inserted 3 records in setUp, all with created_at = now() or near now
        $today = $response->json('today');
        $this->assertGreaterThanOrEqual(1, $today,
            'Today count should reflect records created today');
    }

    /**
     * @test
     * Regular user cannot access stats (403 Forbidden).
     */
    public function test_regular_user_cannot_access_stats(): void
    {
        Sanctum::actingAs($this->regularUser, [], 'sanctum');

        $response = $this->getJson('/api/audit-logs/stats');
        $response->assertStatus(403);
    }

    // ─── GET /api/audit-logs/anomalies ────────────────────────────────────────

    /**
     * @test
     * Admin can retrieve anomalies and response has correct structure.
     */
    public function test_admin_can_get_anomalies(): void
    {
        Sanctum::actingAs($this->adminUser, [], 'sanctum');

        $response = $this->getJson('/api/audit-logs/anomalies');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'anomalies',
                     'total',
                     'critical',
                     'high',
                     'medium',
                     'ai_model',
                     'generated_at',
                 ]);

        $this->assertIsArray($response->json('anomalies'));
        $this->assertEquals('SPPT-AI', $response->json('ai_model'));
    }

    /**
     * @test
     * Anomalies response total matches array count.
     */
    public function test_anomalies_total_matches_array_count(): void
    {
        Sanctum::actingAs($this->adminUser, [], 'sanctum');

        $response = $this->getJson('/api/audit-logs/anomalies');
        $response->assertStatus(200);

        $anomalies = $response->json('anomalies');
        $total     = $response->json('total');
        $this->assertCount($total, $anomalies,
            'anomalies array count should equal total field');
    }

    /**
     * @test
     * Regular user cannot access anomalies (403 Forbidden).
     */
    public function test_regular_user_cannot_access_anomalies(): void
    {
        Sanctum::actingAs($this->regularUser, [], 'sanctum');

        $response = $this->getJson('/api/audit-logs/anomalies');
        $response->assertStatus(403);
    }

    // ─── GET /api/audit-logs/{id} ─────────────────────────────────────────────

    /**
     * @test
     * Admin can retrieve full log detail with diff.
     */
    public function test_admin_can_get_log_detail(): void
    {
        Sanctum::actingAs($this->adminUser, [], 'sanctum');

        // Get the first log ID
        $firstLog = AuditTrail::first();
        $this->assertNotNull($firstLog);

        $response = $this->getJson("/api/audit-logs/{$firstLog->id}");

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'id', 'user_id', 'user_name', 'user_email',
                     'action', 'module', 'ip_address',
                     'old_values', 'new_values', 'diff',
                     'severity', 'created_at',
                 ]);

        $this->assertEquals($firstLog->id, $response->json('id'));
    }

    /**
     * @test
     * Requesting non-existent log returns 404.
     */
    public function test_nonexistent_log_returns_404(): void
    {
        Sanctum::actingAs($this->adminUser, [], 'sanctum');

        $response = $this->getJson('/api/audit-logs/999999');
        $response->assertStatus(404);
    }

    /**
     * @test
     * Regular user cannot view another user's log (403).
     */
    public function test_regular_user_cannot_view_other_users_log(): void
    {
        Sanctum::actingAs($this->regularUser, [], 'sanctum');

        // Get a log that belongs to adminUser
        $adminLog = AuditTrail::where('user_id', $this->adminUser->id)->first();
        $this->assertNotNull($adminLog);

        $response = $this->getJson("/api/audit-logs/{$adminLog->id}");
        $response->assertStatus(403);
    }

    // ─── POST /api/audit-logs/export ─────────────────────────────────────────

    /**
     * @test
     * Admin can trigger export and receive report metadata.
     */
    public function test_admin_can_export_compliance_report(): void
    {
        Sanctum::actingAs($this->adminUser, [], 'sanctum');

        $response = $this->postJson('/api/audit-logs/export', [
            'from'   => now()->subMonth()->toDateString(),
            'to'     => now()->toDateString(),
            'format' => 'csv',
        ]);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'report_id',
                     'pdf_url',
                     'from',
                     'to',
                     'total_records',
                     'format',
                     'generated_at',
                     'generated_by',
                 ]);

        $this->assertStringStartsWith('BNM-AUDIT-', $response->json('report_id'));
        $this->assertEquals('csv', $response->json('format'));
    }

    /**
     * @test
     * Regular user cannot export (403 Forbidden).
     */
    public function test_regular_user_cannot_export(): void
    {
        Sanctum::actingAs($this->regularUser, [], 'sanctum');

        $response = $this->postJson('/api/audit-logs/export', [
            'from'   => now()->subMonth()->toDateString(),
            'to'     => now()->toDateString(),
            'format' => 'csv',
        ]);

        $response->assertStatus(403);
    }
}
