<?php

namespace App\Modules\AuditKawalan\Tests;

use App\Models\AuditTrail;
use App\Models\User;
use Database\Seeders\CoreRolesOnlySeeder;
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

        $this->seed(CoreRolesOnlySeeder::class);

        $this->admin = User::factory()->create([
            'role'        => 'system_admin',
            'permissions' => ['module11' => true, 'all' => true],
        ]);
        $this->admin->assignRole('Pentadbir Sistem');

        $this->regularUser = User::factory()->create([
            'role'        => 'pegawai_cawangan',
            'permissions' => ['modules' => ['module11']],
        ]);
        $this->regularUser->assignRole('Pegawai Cawangan');

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
                'data' => [
                    '*' => ['id', 'user_id', 'action', 'module', 'created_at']
                ]
            ]);
    }

    public function test_regular_user_cannot_get_audit_logs(): void
    {
        $this->actingAs($this->regularUser, 'sanctum')
            ->getJson('/api/audit-logs')
            ->assertStatus(403);
    }

    // ─── GET /api/audit-logs/{id} ────────────────────────────────────────────

    public function test_admin_can_get_specific_audit_log(): void
    {
        $log = AuditTrail::first();

        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/audit-logs/' . $log->id)
            ->assertStatus(200)
            ->assertJson([
                'data' => [
                    'id' => $log->id,
                    'action' => $log->action,
                ]
            ]);
    }

    // ─── GET /api/audit-logs/anomalies ───────────────────────────────────────

    public function test_admin_can_get_audit_anomalies(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/audit-logs/anomalies')
            ->assertStatus(200)
            ->assertJsonStructure([
                'data'
            ]);
    }

    // ─── POST /api/audit-logs/export ─────────────────────────────────────────

    public function test_admin_can_export_audit_logs(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/audit-logs/export', ['format' => 'csv'])
            ->assertStatus(200);
    }

    // ─── GET /api/audit-logs/stats ───────────────────────────────────────────

    public function test_admin_can_get_audit_stats(): void
    {
        $this->actingAs($this->admin, 'sanctum')
            ->getJson('/api/audit-logs/stats')
            ->assertStatus(200)
            ->assertJsonStructure([
                'data'
            ]);
    }
}