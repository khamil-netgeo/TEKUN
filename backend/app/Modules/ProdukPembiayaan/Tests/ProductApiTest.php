<?php

namespace App\Modules\ProdukPembiayaan\Tests;

use Tests\TestCase;
use App\Models\User;
use App\Modules\ProdukPembiayaan\Models\FinancingProduct;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

/**
 * Module 9 — Produk Pembiayaan
 * Feature tests for all product API endpoints.
 */
class ProductApiTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private User $pegawaiUser;
    private FinancingProduct $product;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles and permissions
        $this->artisan('db:seed', ['--class' => 'CoreRbacSeeder']);

        // Create test users
        $this->adminUser = User::factory()->create(['email' => 'admin_test@tekun.gov.my']);
        $this->adminUser->assignRole('system_admin');

        $this->pegawaiUser = User::factory()->create(['email' => 'pegawai_test@tekun.gov.my']);
        $this->pegawaiUser->assignRole('branch_officer');

        // Create a test product
        $this->product = FinancingProduct::create([
            'code'             => 'SKM-TEST',
            'name'             => 'TEKUN Test Scheme',
            'name_en'          => 'TEKUN Test Scheme EN',
            'min_amount'       => 1000.00,
            'max_amount'       => 50000.00,
            'profit_rate'      => 4.00,
            'min_tenure_months'=> 6,
            'max_tenure_months'=> 36,
            'min_age'          => 18,
            'max_age'          => 60,
            'eligible_genders' => ['M', 'F'],
            'is_active'        => true,
            'color_hex'        => '#1B2B5E',
            'display_order'    => 99,
        ]);
    }

    /** @test */
    public function it_returns_product_list_for_authenticated_user(): void
    {
        Sanctum::actingAs($this->pegawaiUser);

        $response = $this->getJson('/api/products');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'data' => [['id', 'code', 'name', 'profit_rate', 'is_active']],
                     'meta' => ['total', 'active', 'inactive'],
                 ]);
    }

    /** @test */
    public function it_rejects_unauthenticated_product_list_request(): void
    {
        $response = $this->getJson('/api/products');
        $response->assertStatus(401);
    }

    /** @test */
    public function it_returns_product_detail(): void
    {
        Sanctum::actingAs($this->pegawaiUser);

        $response = $this->getJson("/api/products/{$this->product->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('data.code', 'SKM-TEST')
                 ->assertJsonStructure([
                     'data' => ['id', 'code', 'name', 'profit_rate', 'min_age', 'max_age', 'eligibility_rules'],
                 ]);
    }

    /** @test */
    public function it_returns_404_for_nonexistent_product(): void
    {
        Sanctum::actingAs($this->pegawaiUser);

        $response = $this->getJson('/api/products/99999');
        $response->assertStatus(404);
    }

    /** @test */
    public function admin_can_update_product_configuration(): void
    {
        Sanctum::actingAs($this->adminUser);

        $response = $this->putJson("/api/products/{$this->product->id}", [
            'profit_rate'      => 3.75,
            'max_tenure_months'=> 48,
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('data.profit_rate', 3.75)
                 ->assertJsonPath('data.max_tenure_months', 48);
    }

    /** @test */
    public function branch_officer_cannot_update_product_configuration(): void
    {
        Sanctum::actingAs($this->pegawaiUser);

        $response = $this->putJson("/api/products/{$this->product->id}", [
            'profit_rate' => 2.00,
        ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function admin_can_deactivate_and_reactivate_product(): void
    {
        Sanctum::actingAs($this->adminUser);

        // Deactivate
        $response = $this->postJson("/api/products/{$this->product->id}/activate", [
            'action' => 'deactivate',
            'notes'  => 'Temporary suspension for review.',
        ]);
        $response->assertStatus(200)
                 ->assertJsonPath('data.is_active', false);

        // Reactivate
        $response = $this->postJson("/api/products/{$this->product->id}/activate", [
            'action' => 'activate',
        ]);
        $response->assertStatus(200)
                 ->assertJsonPath('data.is_active', true);
    }

    /** @test */
    public function it_prevents_double_activation(): void
    {
        Sanctum::actingAs($this->adminUser);

        // Product is already active
        $response = $this->postJson("/api/products/{$this->product->id}/activate", [
            'action' => 'activate',
        ]);
        $response->assertStatus(409);
    }

    /** @test */
    public function eligibility_check_passes_for_valid_applicant(): void
    {
        Sanctum::actingAs($this->pegawaiUser);

        $response = $this->getJson("/api/products/{$this->product->id}/eligibility-check?" . http_build_query([
            'ic'                  => '900101015678',
            'gender'              => 'M',
            'sector'              => 'perniagaan',
            'business_age_months' => 12,
            'is_blacklisted'      => false,
            'ccris_clear'         => true,
            'muflis_clear'        => true,
        ]));

        $response->assertStatus(200)
                 ->assertJsonPath('data.eligible', true)
                 ->assertJsonStructure([
                     'data' => ['eligible', 'product', 'passed', 'failed', 'warnings', 'summary'],
                 ]);
    }

    /** @test */
    public function eligibility_check_fails_for_blacklisted_applicant(): void
    {
        Sanctum::actingAs($this->pegawaiUser);

        $response = $this->getJson("/api/products/{$this->product->id}/eligibility-check?" . http_build_query([
            'ic'             => '900101015678',
            'is_blacklisted' => true,
        ]));

        $response->assertStatus(200)
                 ->assertJsonPath('data.eligible', false);
    }

    /** @test */
    public function eligibility_check_requires_ic_parameter(): void
    {
        Sanctum::actingAs($this->pegawaiUser);

        $response = $this->getJson("/api/products/{$this->product->id}/eligibility-check");
        $response->assertStatus(422)
                 ->assertJsonStructure(['errors' => ['ic']]);
    }

    /** @test */
    public function it_validates_max_amount_greater_than_min_amount(): void
    {
        Sanctum::actingAs($this->adminUser);

        $response = $this->putJson("/api/products/{$this->product->id}", [
            'min_amount' => 50000,
            'max_amount' => 1000,
        ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function it_returns_audit_logs_for_product(): void
    {
        Sanctum::actingAs($this->adminUser);

        // Make a change to generate an audit log
        $this->putJson("/api/products/{$this->product->id}", ['profit_rate' => 3.50]);

        $response = $this->getJson("/api/products/{$this->product->id}/audit-logs");
        $response->assertStatus(200)
                 ->assertJsonStructure(['data', 'total', 'per_page']);
    }
}
