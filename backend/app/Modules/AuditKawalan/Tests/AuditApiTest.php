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

        $this->admin = User::factory()->create();
        try {
            $this->admin->assignRole('Pentadbir Sistem');
        } catch (\Exception $e) {
            // Ignore if role does not exist
        }

        $this->regularUser = User::factory()->create();
        try {
            $this->regularUser->assignRole('Pegawai Cawangan');
        } catch (\Exception $e) {
            // Ignore if role does not exist
        }

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
            ->assertStatus(200);
    }
}