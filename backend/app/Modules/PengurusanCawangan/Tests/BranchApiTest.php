<?php

namespace App\Modules\PengurusanCawangan\Tests;


use Tests\TestCase;
use App\Models\User;
use App\Models\Branch;

/**
 * TEKUN SPPT — Module 8: Pengurusan Cawangan
 * Feature tests for all branch management API endpoints.
 *
 * Prerequisites:
 *  - php artisan migrate --path=app/Modules/PengurusanCawangan/Database/Migrations
 *  - php artisan db:seed --class="App\Modules\PengurusanCawangan\Database\Seeders\BranchSeeder"
 *  - php artisan db:seed --class=CoreRbacSeeder
 */
class BranchApiTest extends TestCase
{

    private function getUser(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    public function test_unauthenticated_request_returns_401(): void
    {
        $response = $this->getJson('/api/branches');
        $response->assertStatus(401);
    }

    public function test_branch_update_requires_authentication(): void
    {
        $response = $this->putJson('/api/branches/1', ['name' => 'Test']);
        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_list_branches(): void
    {
        $user = $this->getUser('eksekutif@tekun.gov.my');
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

    public function test_branch_list_returns_seeded_data(): void
    {
        $user = $this->getUser('eksekutif@tekun.gov.my');
        if (!$user) {
            $this->markTestSkipped('Demo user not found.');
        }
        $count = Branch::count();
        if ($count === 0) {
            $this->markTestSkipped('No branches in DB. Run BranchSeeder first.');
        }
        $response = $this->actingAs($user, 'sanctum')->getJson('/api/branches');
        $response->assertStatus(200);
        $data = $response->json();
        $this->assertGreaterThan(0, $data['meta']['total']);
    }

    public function test_branch_performance_endpoint_returns_correct_structure(): void
    {
        $user = $this->getUser('eksekutif@tekun.gov.my');
        if (!$user) {
            $this->markTestSkipped('Demo user not found.');
        }
        $response = $this->actingAs($user, 'sanctum')->getJson('/api/branches/performance');
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'period',
                     'branches',
                     'avg_collection',
                     'avg_npl',
                     'total_branches',
                 ]);
    }

    public function test_branch_detail_returns_correct_structure(): void
    {
        $user = $this->getUser('eksekutif@tekun.gov.my');
        if (!$user) {
            $this->markTestSkipped('Demo user not found.');
        }
        $branchId = Branch::value('id');
        if (!$branchId) {
            $this->markTestSkipped('No branches in DB. Run BranchSeeder first.');
        }
        $response = $this->actingAs($user, 'sanctum')->getJson("/api/branches/{$branchId}");
        $response->assertStatus(200)
                 ->assertJsonStructure(['branch', 'performance']);
    }

    public function test_branch_staff_endpoint_returns_correct_structure(): void
    {
        $user = $this->getUser('eksekutif@tekun.gov.my');
        if (!$user) {
            $this->markTestSkipped('Demo user not found.');
        }
        $branchId = Branch::value('id');
        if (!$branchId) {
            $this->markTestSkipped('No branches in DB. Run BranchSeeder first.');
        }
        $response = $this->actingAs($user, 'sanctum')->getJson("/api/branches/{$branchId}/staff");
        $response->assertStatus(200)
                 ->assertJsonStructure(['branch', 'staff', 'total']);
    }

    public function test_branch_update_with_valid_data(): void
    {
        $user = $this->getUser('admin@tekun.gov.my');
        if (!$user) {
            $this->markTestSkipped('Admin user not found.');
        }
        $branchId = Branch::value('id');
        if (!$branchId) {
            $this->markTestSkipped('No branches in DB. Run BranchSeeder first.');
        }
        $response = $this->actingAs($user, 'sanctum')->putJson("/api/branches/{$branchId}", [
            'phone' => '03-99887766',
        ]);
        $response->assertStatus(200)
                 ->assertJsonStructure(['message', 'branch']);
    }
}
