#!/usr/bin/env python3
content = r'''<?php

namespace App\Modules\ProdukPembiayaan\Tests;

use Tests\TestCase;
use App\Models\User;
use App\Modules\ProdukPembiayaan\Models\FinancingProduct;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;

/**
 * Module 9 — Produk Pembiayaan
 * Feature tests for all product API endpoints.
 *
 * PHPUnit 12 compatible — uses test_ prefix (not @test annotation).
 * Uses DatabaseTransactions to avoid dropping/recreating tables.
 */
class ProductApiTest extends TestCase
{
    use DatabaseTransactions;

    private User $adminUser;
    private User $pegawaiUser;
    private FinancingProduct $product;

    protected function setUp(): void
    {
        parent::setUp();

        $uid = substr(uniqid(), -6);

        $this->adminUser = User::factory()->create([
            'email'       => "admin_m9_{$uid}@tekun.gov.my",
            'role'        => 'system_admin',
            'permissions' => [
                'modules'        => ['*'],
                'actions'        => ['*'],
                'data_scope'     => 'national',
                'approval_limit' => 999999,
            ],
        ]);

        $this->pegawaiUser = User::factory()->create([
            'email'       => "pegawai_m9_{$uid}@tekun.gov.my",
            'role'        => 'branch_officer',
            'permissions' => [
                'modules'        => ['module9'],
                'actions'        => ['read'],
                'data_scope'     => 'branch',
                'approval_limit' => 0,
            ],
        ]);

        $this->product = FinancingProduct::create([
            'code'                     => 'TST' . $uid,
            'name'                     => 'TEKUN Test Scheme',
            'name_en'                  => 'TEKUN Test Scheme EN',
            'min_amount'               => 1000.00,
            'max_amount'               => 50000.00,
            'profit_rate'              => 4.00,
            'min_tenure_months'        => 6,
            'max_tenure_months'        => 36,
            'min_age'                  => 18,
            'max_age'                  => 60,
            'eligible_genders'         => ['M', 'F'],
            'blacklist_check_required' => true,
            'is_active'                => true,
            'color_hex'                => '#1B2B5E',
            'display_order'            => 99,
        ]);
    }

    public function test_authenticated_user_can_list_products(): void
    {
        Sanctum::actingAs($this->pegawaiUser);
        $response = $this->getJson('/api/products');
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [['id', 'code', 'name', 'profit_rate', 'is_active']],
                     'meta' => ['total', 'active', 'inactive'],
                 ]);
    }

    public function test_unauthenticated_request_is_rejected(): void
    {
        $response = $this->getJson('/api/products');
        $response->assertStatus(401);
    }

    public function test_product_detail_is_returned(): void
    {
        Sanctum::actingAs($this->pegawaiUser);
        $response = $this->getJson("/api/products/{$this->product->id}");
        $response->assertStatus(200)
                 ->assertJsonPath('data.code', $this->product->code)
                 ->assertJsonStructure([
                     'data' => ['id', 'code', 'name', 'profit_rate', 'min_age', 'max_age', 'eligibility_rules'],
                 ]);
    }

    public function test_nonexistent_product_returns_404(): void
    {
        Sanctum::actingAs($this->pegawaiUser);
        $response = $this->getJson('/api/products/99999999');
        $response->assertStatus(404);
    }

    public function test_admin_can_update_product(): void
    {
        Sanctum::actingAs($this->adminUser);
        $response = $this->putJson("/api/products/{$this->product->id}", [
            'profit_rate'       => 3.75,
            'max_tenure_months' => 48,
        ]);
        $response->assertStatus(200)
                 ->assertJsonPath('data.profit_rate', 3.75)
                 ->assertJsonPath('data.max_tenure_months', 48);
    }

    public function test_branch_officer_cannot_update_product(): void
    {
        Sanctum::actingAs($this->pegawaiUser);
        $response = $this->putJson("/api/products/{$this->product->id}", [
            'profit_rate' => 2.00,
        ]);
        $response->assertStatus(403);
    }

    public function test_invalid_amount_fails_validation(): void
    {
        Sanctum::actingAs($this->adminUser);
        $response = $this->putJson("/api/products/{$this->product->id}", [
            'min_amount' => 50000,
            'max_amount' => 1000,
        ]);
        $response->assertStatus(422);
    }

    public function test_admin_can_deactivate_product(): void
    {
        Sanctum::actingAs($this->adminUser);
        $response = $this->postJson("/api/products/{$this->product->id}/activate", [
            'action' => 'deactivate',
            'notes'  => 'Temporary suspension for review.',
        ]);
        $response->assertStatus(200)
                 ->assertJsonPath('data.is_active', false);
    }

    public function test_admin_can_reactivate_product(): void
    {
        $this->product->update(['is_active' => false]);
        Sanctum::actingAs($this->adminUser);
        $response = $this->postJson("/api/products/{$this->product->id}/activate", [
            'action' => 'activate',
        ]);
        $response->assertStatus(200)
                 ->assertJsonPath('data.is_active', true);
    }

    public function test_double_activation_returns_conflict(): void
    {
        Sanctum::actingAs($this->adminUser);
        $response = $this->postJson("/api/products/{$this->product->id}/activate", [
            'action' => 'activate',
        ]);
        $response->assertStatus(409);
    }

    public function test_eligibility_check_returns_result(): void
    {
        Sanctum::actingAs($this->pegawaiUser);
        $params = http_build_query([
            'ic'                  => '900101015678',
            'gender'              => 'M',
            'sector'              => 'perniagaan',
            'business_age_months' => 12,
            'is_blacklisted'      => 0,
            'ccris_clear'         => 1,
            'muflis_clear'        => 1,
        ]);
        $response = $this->getJson("/api/products/{$this->product->id}/eligibility-check?{$params}");
        $response->assertStatus(200)
                 ->assertJsonPath('data.eligible', true)
                 ->assertJsonStructure([
                     'data' => ['eligible', 'product', 'passed', 'failed', 'warnings', 'summary'],
                 ]);
    }

    public function test_eligibility_check_rejects_blacklisted(): void
    {
        Sanctum::actingAs($this->pegawaiUser);
        $params = http_build_query([
            'ic'             => '900101015678',
            'is_blacklisted' => 1,
        ]);
        $response = $this->getJson("/api/products/{$this->product->id}/eligibility-check?{$params}");
        $response->assertStatus(200)
                 ->assertJsonPath('data.eligible', false);
    }

    public function test_eligibility_check_requires_ic_parameter(): void
    {
        Sanctum::actingAs($this->pegawaiUser);
        $response = $this->getJson("/api/products/{$this->product->id}/eligibility-check");
        $response->assertStatus(422)
                 ->assertJsonStructure(['errors' => ['ic']]);
    }

    public function test_audit_logs_are_returned(): void
    {
        Sanctum::actingAs($this->adminUser);
        $this->putJson("/api/products/{$this->product->id}", ['profit_rate' => 3.50]);
        $response = $this->getJson("/api/products/{$this->product->id}/audit-logs");
        $response->assertStatus(200)
                 ->assertJsonStructure(['data', 'total', 'per_page']);
    }
}
'''

filepath = '/home/ubuntu/sppt/backend/app/Modules/ProdukPembiayaan/Tests/ProductApiTest.php'
with open(filepath, 'w') as f:
    f.write(content)

with open(filepath, 'r') as f:
    written = f.read()

test_count = written.count('public function test_')
has_dt = 'DatabaseTransactions' in written
has_rf = 'RefreshDatabase' in written
print(f"test_ methods: {test_count}, DatabaseTransactions: {has_dt}, RefreshDatabase: {has_rf}")
