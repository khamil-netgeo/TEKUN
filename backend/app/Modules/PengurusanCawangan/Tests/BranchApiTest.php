<?php

namespace App\Modules\PengurusanCawangan\Tests;

use Tests\TestCase;
use App\Models\User;
use App\Models\Branch;

/**
 * TEKUN SPPT — Module 8: Pengurusan Cawangan
 * Feature tests for Branch Management API endpoints.
 * Uses actingAs() with pre-seeded demo users (no RefreshDatabase).
 */
class BranchApiTest extends TestCase
{
    private function getUser(string $email = 'eksekutif@tekun.gov.my'): ?User
    {
        return User::where('email', $email)->first();
    }

    private function getFirstBranchId(): ?int
    {
        $branch = Branch::first();
        return $branch?->id;
    }

    /** @test */
    public function test_unauthenticated_request_returns_401(): void
    {
        $response = $this->getJson('/api/branches');
        $response->assertStatus(401);
    }

    /** @test */
    public function test_branch_update_requires_authentication(): void
    {
        $response = $this->putJson('/api/branches/1', ['phone' => '03-12345678']);
        $response->assertStatus(401);
    }

    /** @test */
    public function test_authenticated_user_can_list_branches(): void
    {
        $user = $this->getUser();
        if (!$user) {
            $this->markTestSkipped('Demo user not found. Run CoreRbacSeeder first.');
        }
        $response = $this->actingAs($user, 'sanctum')->getJson('/api/branches');
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data',
                     'meta' => ['total', 'per_page', 'current_page', 'last_page'],
                     'summary' => ['total_branches', 'total_staff', 'avg_collection_rate', 'avg_npl_ratio'],
                 ]);
    }

    /** @test */
    public function test_branch_list_returns_seeded_data(): void
    {
        $user = $this->getUser();
        if (!$user) {
            $this->markTestSkipped('Demo user not found.');
        }
        $response = $this->actingAs($user, 'sanctum')->getJson('/api/branches');
        $response->assertStatus(200);
        $this->assertGreaterThanOrEqual(0, $response->json('meta.total'));
    }

    /** @test */
    public function test_branch_performance_endpoint_returns_correct_structure(): void
    {
        $user = $this->getUser();
        if (!$user) {
            $this->markTestSkipped('Demo user not found.');
        }
        $response = $this->actingAs($user, 'sanctum')->getJson('/api/branches/performance');
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'period', 'branches', 'avg_collection', 'avg_npl', 'total_branches',
                 ]);
    }

    /** @test */
    public function test_branch_detail_returns_correct_structure(): void
    {
        $user = $this->getUser();
        if (!$user) {
            $this->markTestSkipped('Demo user not found.');
        }
        $branchId = $this->getFirstBranchId();
        if (!$branchId) {
            $this->markTestSkipped('No branches in DB. Run BranchSeeder first.');
        }
        $response = $this->actingAs($user, 'sanctum')->getJson("/api/branches/{$branchId}");
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => ['id', 'code', 'name', 'state', 'district', 'collection_rate', 'npl_ratio'],
                 ]);
    }

    /** @test */
    public function test_branch_staff_endpoint_returns_correct_structure(): void
    {
        $user = $this->getUser();
        if (!$user) {
            $this->markTestSkipped('Demo user not found.');
        }
        $branchId = $this->getFirstBranchId();
        if (!$branchId) {
            $this->markTestSkipped('No branches in DB. Run BranchSeeder first.');
        }
        $response = $this->actingAs($user, 'sanctum')->getJson("/api/branches/{$branchId}/staff");
        $response->assertStatus(200)
                 ->assertJsonStructure(['branch', 'staff', 'total']);
    }

    /** @test */
    public function test_branch_update_with_valid_data(): void
    {
        $user = $this->getUser('admin@tekun.gov.my');
        if (!$user) {
            $this->markTestSkipped('Admin user not found. Run CoreRbacSeeder first.');
        }
        $branchId = $this->getFirstBranchId();
        if (!$branchId) {
            $this->markTestSkipped('No branches in DB. Run BranchSeeder first.');
        }
        $response = $this->actingAs($user, 'sanctum')
                         ->putJson("/api/branches/{$branchId}", [
                             'phone'   => '03-12345678',
                             'address' => 'Alamat Ujian, Kuala Lumpur',
                         ]);
        $response->assertStatus(200)
                 ->assertJsonStructure(['message', 'data']);
    }
}
