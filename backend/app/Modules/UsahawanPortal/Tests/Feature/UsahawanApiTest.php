<?php

namespace App\Modules\UsahawanPortal\Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Modules\PermohonanPembiayaan\Models\Application;
use App\Modules\PengurusanAkaun\Models\Account;
use App\Modules\PengurusanAkaun\Models\Payment;
use App\Modules\PengurusanAkaun\Models\Moratorium;
use Laravel\Sanctum\Sanctum;

class UsahawanApiTest extends TestCase
{
    private User $usahawanUser;
    private User $staffUser;

    protected function setUp(): void
    {
        parent::setUp();
        $uid = substr(uniqid(), -6);

        $this->usahawanUser = User::factory()->create([
            'email' => "usahawan_{$uid}@test.com",
            'role'  => 'usahawan',
        ]);
        $this->usahawanUser->assignRole('usahawan');

        $this->staffUser = User::factory()->create([
            'email' => "staff_{$uid}@test.com",
            'role'  => 'Pegawai Cawangan',
        ]);
        $this->staffUser->assignRole('Pegawai Cawangan');
    }

    public function test_dashboard_requires_authentication(): void
    {
        $response = $this->getJson('/api/usahawan/dashboard');
        $response->assertStatus(401);
    }

    public function test_dashboard_rejects_non_usahawan(): void
    {
        Sanctum::actingAs($this->staffUser);
        $response = $this->getJson('/api/usahawan/dashboard');
        $response->assertStatus(403);
    }

    public function test_dashboard_returns_correct_structure(): void
    {
        Sanctum::actingAs($this->usahawanUser);
        $response = $this->getJson('/api/usahawan/dashboard');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'name',
                    'outstanding_balance',
                    'next_installment_amount',
                    'total_applications',
                    'recent_activities',
                ],
            ]);
    }

    public function test_my_applications_requires_authentication(): void
    {
        $response = $this->getJson('/api/usahawan/my-applications');
        $response->assertStatus(401);
    }

    public function test_my_applications_returns_paginated_list(): void
    {
        Sanctum::actingAs($this->usahawanUser);
        $response = $this->getJson('/api/usahawan/my-applications');
        $response->assertStatus(200)
            ->assertJsonStructure(['success', 'data']);
    }

    public function test_my_account_returns_404_when_no_account(): void
    {
        Sanctum::actingAs($this->usahawanUser);
        $response = $this->getJson('/api/accounts/my');
        $response->assertStatus(404)
            ->assertJson(['success' => false]);
    }

    public function test_store_payment_validates_required_fields(): void
    {
        Sanctum::actingAs($this->usahawanUser);
        $response = $this->postJson('/api/accounts/my/payment', []);
        $response->assertStatus(422);
    }

    public function test_store_payment_rejects_invalid_channel(): void
    {
        Sanctum::actingAs($this->usahawanUser);
        $response = $this->postJson('/api/accounts/my/payment', [
            'amount'       => 100,
            'channel'      => 'invalid_channel',
            'payment_type' => 'installment',
        ]);
        $response->assertStatus(422);
    }

    public function test_store_moratorium_validates_required_fields(): void
    {
        Sanctum::actingAs($this->usahawanUser);
        $response = $this->postJson('/api/accounts/my/moratorium', []);
        $response->assertStatus(422);
    }

    public function test_store_moratorium_rejects_invalid_type(): void
    {
        Sanctum::actingAs($this->usahawanUser);
        $response = $this->postJson('/api/accounts/my/moratorium', [
            'moratorium_type' => 'invalid_type',
            'duration_months' => 3,
            'reason'          => 'Test reason',
        ]);
        $response->assertStatus(422);
    }

    public function test_my_applications_rejects_non_usahawan(): void
    {
        Sanctum::actingAs($this->staffUser);
        $response = $this->getJson('/api/usahawan/my-applications');
        $response->assertStatus(403);
    }
}
