<?php

namespace App\Modules\PentadbiranSistem\Tests;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Module 12 — Pentadbiran Sistem
 * Feature Tests: UserApiTest
 *
 * 13 tests covering all Orchestrator audit requirements.
 */
class UserApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();

        $adminRole   = Role::firstOrCreate(['name' => 'Pentadbir Sistem',  'guard_name' => 'sanctum']);
        $officerRole = Role::firstOrCreate(['name' => 'Pegawai Cawangan',  'guard_name' => 'sanctum']);
        Role::firstOrCreate(['name' => 'Pengurus Cawangan', 'guard_name' => 'sanctum']);
        Role::firstOrCreate(['name' => 'Pegawai Kredit',    'guard_name' => 'sanctum']);
        Role::firstOrCreate(['name' => 'Eksekutif',         'guard_name' => 'sanctum']);

        $this->admin = User::factory()->create([
            'name' => 'Admin Ujian', 'email' => 'admin@tekun.gov.my',
            'is_active' => true, 'is_suspended' => false,
        ]);
        $this->admin->assignRole($adminRole);

        $this->regularUser = User::factory()->create([
            'name' => 'Pegawai Ujian', 'email' => 'pegawai@tekun.gov.my',
            'is_active' => true, 'is_suspended' => false,
        ]);
        $this->regularUser->assignRole($officerRole);
    }

    public function test_index_returns_paginated_users_with_roles(): void
    {
        User::factory()->count(5)->create();
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/users');
        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'data' => [['id','name','email','role','status','is_active','is_suspended']], 'meta' => ['current_page','last_page','per_page','total']])
            ->assertJsonPath('success', true);
        $this->assertGreaterThanOrEqual(2, count($response->json('data')));
    }

    public function test_index_supports_search_filter(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/users?search=Admin+Ujian');
        $response->assertStatus(200);
        $data = $response->json('data');
        $this->assertNotEmpty($data);
        $this->assertStringContainsStringIgnoringCase('Admin', $data[0]['name']);
    }

    public function test_store_creates_user_and_assigns_spatie_role(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/users', [
            'name' => 'Pengguna Baharu', 'email' => 'baharu@tekun.gov.my',
            'password' => 'SecurePass123!', 'role' => 'Pegawai Cawangan', 'branch' => 'KL Sentral',
        ]);
        $response->assertStatus(201)->assertJsonPath('success', true)
            ->assertJsonPath('data.email', 'baharu@tekun.gov.my')
            ->assertJsonPath('data.role', 'Pegawai Cawangan');
        $this->assertDatabaseHas('users', ['email' => 'baharu@tekun.gov.my']);
        $newUser = User::where('email', 'baharu@tekun.gov.my')->first();
        $this->assertTrue($newUser->hasRole('Pegawai Cawangan'));
    }

    public function test_store_rejects_short_password(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson('/api/users', [
            'name' => 'Test', 'email' => 'test@tekun.gov.my', 'password' => 'short', 'role' => 'Pegawai Cawangan',
        ]);
        $response->assertStatus(422)->assertJsonPath('success', false)->assertJsonStructure(['errors' => ['password']]);
    }

    public function test_update_syncs_spatie_role(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->putJson("/api/users/{$this->regularUser->id}", [
            'name' => 'Nama Dikemaskini', 'email' => $this->regularUser->email, 'role' => 'Pegawai Kredit',
        ]);
        $response->assertStatus(200)->assertJsonPath('success', true);
        $this->regularUser->refresh();
        $this->assertTrue($this->regularUser->hasRole('Pegawai Kredit'));
        $this->assertFalse($this->regularUser->hasRole('Pegawai Cawangan'));
    }

    public function test_suspend_updates_is_suspended_in_database(): void
    {
        $this->assertFalse((bool) $this->regularUser->is_suspended);
        $response = $this->actingAs($this->admin, 'sanctum')->postJson("/api/users/{$this->regularUser->id}/suspend");
        $response->assertStatus(200)->assertJsonPath('success', true)->assertJsonPath('data.is_suspended', true);
        $this->assertDatabaseHas('users', ['id' => $this->regularUser->id, 'is_suspended' => true]);
        $this->regularUser->refresh();
        $this->assertTrue((bool) $this->regularUser->is_suspended);
    }

    public function test_admin_cannot_suspend_own_account(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson("/api/users/{$this->admin->id}/suspend");
        $response->assertStatus(422)->assertJsonPath('success', false);
        $this->assertDatabaseHas('users', ['id' => $this->admin->id, 'is_suspended' => false]);
    }

    public function test_activate_updates_database_correctly(): void
    {
        $this->regularUser->is_suspended = true; $this->regularUser->is_active = false; $this->regularUser->save();
        $response = $this->actingAs($this->admin, 'sanctum')->postJson("/api/users/{$this->regularUser->id}/activate");
        $response->assertStatus(200)->assertJsonPath('success', true)
            ->assertJsonPath('data.is_suspended', false)->assertJsonPath('data.is_active', true);
        $this->assertDatabaseHas('users', ['id' => $this->regularUser->id, 'is_suspended' => false, 'is_active' => true]);
    }

    public function test_stats_returns_real_db_counts(): void
    {
        User::factory()->create(['is_suspended' => true]);
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/users/stats');
        $response->assertStatus(200)->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['total','active','suspended','inactive','new_this_month','by_role']]);
        $data = $response->json('data');
        $this->assertGreaterThanOrEqual(3, $data['total']);
        $this->assertGreaterThanOrEqual(1, $data['suspended']);
    }

    public function test_roles_returns_spatie_roles_with_counts(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->getJson('/api/roles');
        $response->assertStatus(200)->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => [['id','name','users_count','permissions','permissions_count']]]);
        $roles = collect($response->json('data'));
        $this->assertTrue($roles->contains('name', 'Pentadbir Sistem'));
        $this->assertTrue($roles->contains('name', 'Pegawai Cawangan'));
    }

    public function test_non_admin_cannot_access_user_management(): void
    {
        $response = $this->actingAs($this->regularUser, 'sanctum')->getJson('/api/users');
        $response->assertStatus(403);
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $response = $this->getJson('/api/users');
        $response->assertStatus(401);
    }

    public function test_reset_password_returns_temp_password(): void
    {
        $response = $this->actingAs($this->admin, 'sanctum')->postJson("/api/users/{$this->regularUser->id}/reset-password");
        $response->assertStatus(200)->assertJsonPath('success', true)->assertJsonStructure(['temp_password', 'note']);
        $tempPw = $response->json('temp_password');
        $this->assertNotEmpty($tempPw);
        $this->assertGreaterThanOrEqual(16, strlen($tempPw));
    }
}
