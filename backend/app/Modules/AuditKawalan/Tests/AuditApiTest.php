<?php

namespace App\Modules\AuditKawalan\Tests;

use App\Models\AuditTrail;
use App\Models\User;
use Tests\TestCase;

/**
 * AuditApiTest — Module 11: Audit & Kawalan
 *
 * Tests all 5 required API endpoints:
 *   GET  /api/audit-logs
 *   GET  /api/audit-logs/{id}
 *   GET  /api/audit-logs/anomalies
 *   POST /api/audit-logs/export
 *   GET  /api/audit-logs/stats
 */
class AuditApiTest extends TestCase
{

    private User $admin;
    private User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role'        => 'system_admin',
            'permissions' => ['module11' => true, 'all' => true],
        ]);

        $this->regularUser = User::factory()->create([
            'role'        => 'pegawai_cawangan',
            'permissions' => ['modules' => ['module11']],
        ]);

        AuditTrail::insert([
            [
                'user_id'        => $this->admin->id,
                'action'         => 'login',
                'module'         => 'auth',
                'auditable_type' => 'App\Models\User',
                'auditable_id'   => $this->admin->id,
                'ip_address'     => '192.168.1.1',
                'old_values'     => null,
                'new_values'     => null,
                'created_at'     => now(),
                'updated_at'     => now(),
            ],
            [
                'user_id'        => $this->regularUser->id,
                'action'         => 'create',
                'module'         => 'permohonan',
                'auditable_type' => 'App\Models\Application',
                'auditable_id'   => 1,
                'ip_address'     => '10.0.0.5',
                'old_values'     => null,
                'new_values'     => json_encode(['status' => 'draft']),
                'created_at'     => now(),
                'updated_at'     => now(),
            ],
            [
                'user_id'        => $this->admin->id,
                'action'         => 'role_change',
                'module'         => 'auth',
                'auditable_type' => 'App\Models\User',
                'auditable_id'   => $this->regularUser->id,
                'ip_address'     => '192.168.1.1',
                'old_values'     => json_encode(['role' => 'pegawai']),
                'new_values'     => json_encode(['role' => 'pengurus']),
                'created_at'     => now()->subHours(3),
                'updated_at'     => now()->subHours(3),
            ],
        ]);
    }

    // ─── GET /api/audit-logs ─────────────────────────────────────────────────

    public function test_audit_logs_requires_authentication(): void
    {
        $this->getJson('/api/audit-logs')->assertStatus(401);
    }

    public function test_admin_can_get_paginated_audit_logs(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/audit-logs')
            ->assertStatus(200)
            ->assertJsonStructure([
                'data' => [['id', 'user_id', 'user_name', 'action', 'module', 'severity', 'is_anomaly', 'created_at']],
                'total', 'current_page', 'per_page', 'last_page', 'anomaly_count',
            ]);
    }

    public function test_regular_user_sees_only_own_logs(): void
    {
        $response = $this->actingAs($this->regularUser, 'sanctum')
            ->getJson('/api/audit-logs')
            ->assertStatus(200);
        foreach ($response->json('data') as $log) {
            $this->assertEquals($this->regularUser->id, $log['user_id']);
        }
    }

    public function test_audit_logs_filter_by_action(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/audit-logs?action=login')
            ->assertStatus(200);
        foreach ($response->json('data') as $log) {
            $this->assertEquals('login', $log['action']);
        }
    }

    public function test_audit_logs_filter_by_module(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/audit-logs?module=auth')
            ->assertStatus(200);
        foreach ($response->json('data') as $log) {
            $this->assertEquals('auth', $log['module']);
        }
    }

    public function test_audit_logs_pagination_works(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/audit-logs?per_page=2&page=1')
            ->assertStatus(200)
            ->assertJsonPath('per_page', 2)
            ->assertJsonPath('current_page', 1);
    }

    public function test_anomaly_rows_have_is_anomaly_flag(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/audit-logs')
            ->assertStatus(200);
        $data = $response->json('data');
        $roleChangeLogs = array_filter($data, fn($l) => $l['action'] === 'role_change');
        foreach ($roleChangeLogs as $log) {
            $this->assertTrue($log['is_anomaly'], 'role_change should be flagged as anomaly');
            $this->assertNotNull($log['anomaly_reason']);
        }
    }

    // ─── GET /api/audit-logs/stats ───────────────────────────────────────────

    public function test_admin_can_get_audit_stats(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/audit-logs/stats')
            ->assertStatus(200)
            ->assertJsonStructure([
                'total', 'today', 'critical', 'unique_users',
                'by_action', 'by_module', 'daily_trend',
                'today_anomalies', 'top_anomaly_type',
            ]);
    }

    public function test_stats_today_count_is_accurate(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/audit-logs/stats')
            ->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, $response->json('today'));
    }

    public function test_regular_user_cannot_access_stats(): void
    {
        $this->actingAs($this->regularUser, 'sanctum')
            ->getJson('/api/audit-logs/stats')
            ->assertStatus(403);
    }

    // ─── GET /api/audit-logs/anomalies ───────────────────────────────────────

    public function test_admin_can_get_anomalies(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/audit-logs/anomalies')
            ->assertStatus(200)
            ->assertJsonStructure([
                'anomalies', 'total', 'critical', 'medium', 'generated_at', 'ai_model',
            ]);
    }

    public function test_anomalies_total_matches_array_count(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/audit-logs/anomalies')
            ->assertStatus(200);
        $this->assertEquals(
            count($response->json('anomalies')),
            $response->json('total')
        );
    }

    public function test_anomalies_ai_model_is_sppt_ai(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/audit-logs/anomalies')
            ->assertStatus(200)
            ->assertJsonPath('ai_model', 'SPPT-AI');
    }

    public function test_regular_user_cannot_access_anomalies(): void
    {
        $this->actingAs($this->regularUser, 'sanctum')
            ->getJson('/api/audit-logs/anomalies')
            ->assertStatus(403);
    }

    // ─── GET /api/audit-logs/{id} ────────────────────────────────────────────

    public function test_admin_can_get_log_detail(): void
    {
        $log = AuditTrail::first();
        $this->actingAs($this->admin, 'sanctum')
            ->getJson("/api/audit-logs/{$log->id}")
            ->assertStatus(200)
            ->assertJsonStructure([
                'id', 'user_id', 'action', 'module',
                'old_values', 'new_values', 'diff',
                'is_anomaly', 'anomaly_reason', 'created_at',
            ]);
    }

    public function test_nonexistent_log_returns_404(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/audit-logs/999999')
            ->assertStatus(404);
    }

    public function test_regular_user_cannot_view_other_users_log(): void
    {
        $adminLog = AuditTrail::where('user_id', $this->admin->id)->first();
        $this->actingAs($this->regularUser, 'sanctum')
            ->getJson("/api/audit-logs/{$adminLog->id}")
            ->assertStatus(403);
    }

    // ─── POST /api/audit-logs/export ─────────────────────────────────────────

    public function test_admin_can_export_compliance_report(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/audit-logs/export', [
                'from'   => now()->startOfMonth()->toDateString(),
                'to'     => now()->toDateString(),
                'format' => 'pdf',
            ])
            ->assertStatus(201)
            ->assertJsonStructure([
                'report_id', 'pdf_url', 'filename',
                'from', 'to', 'total_records',
                'format', 'generated_at', 'generated_by',
            ]);
        $this->assertStringStartsWith('BNM-AUDIT-', $response->json('report_id'));
    }

    public function test_regular_user_cannot_export(): void
    {
        $this->actingAs($this->regularUser, 'sanctum')
            ->postJson('/api/audit-logs/export', ['format' => 'pdf'])
            ->assertStatus(403);
    }
}
