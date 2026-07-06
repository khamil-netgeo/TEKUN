<?php

namespace App\Modules\ProdukPembiayaan\Tests;

use Tests\TestCase;
use App\Models\User;
use App\Modules\ProdukPembiayaan\Models\FinancingProduct;
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

    private User $adminUser;
    private User $pegawaiUser;
    private FinancingProduct $product;

    protected function setUp(): void
    {
        parent::setUp();

        $uid = substr(uniqid(), -6);

        $this->adminUser = User::factory()->create([
            'email'       => "admin_m9_{$uid}@tekun.gov.my",
        ]);

        try {
            $this->adminUser->assignRole('Pentadbir Sistem');
        } catch (\Exception $e) {
            // Role might not exist in the testing database yet
        }

        $this->pegawaiUser = User::factory()->create([
            'email'       => "pegawai_m9_{$uid}@tekun.gov.my",
        ]);

        try {
            $this->pegawaiUser->assignRole('Pegawai Cawangan');
        } catch (\Exception $e) {
            // Role might not exist in the testing database yet
        }

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
        $response = $this->getJson('/api/products/' . $this->product->id);
        $response->assertStatus(200)
                 ->assertJsonPath('data.id', $this->product->id);
    }
}