<?php

namespace Database\Factories;

use App\Modules\ProdukPembiayaan\Models\FinancingProduct;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory for FinancingProduct — used in M9 PHPUnit tests.
 */
class FinancingProductFactory extends Factory
{
    protected $model = FinancingProduct::class;

    public function definition(): array
    {
        $code = 'TEST-' . strtoupper($this->faker->unique()->lexify('???'));
        return [
            'code'                      => $code,
            'name'                      => $this->faker->words(3, true),
            'name_en'                   => $this->faker->words(3, true),
            'description'               => $this->faker->sentence(),
            'description_en'            => $this->faker->sentence(),
            'min_amount'                => 1000,
            'max_amount'                => 50000,
            'profit_rate'               => $this->faker->randomFloat(2, 3.0, 7.0),
            'min_tenure_months'         => 12,
            'max_tenure_months'         => 60,
            'processing_fee_type'       => 'percentage',
            'processing_fee_value'      => 1.0,
            'min_age'                   => 18,
            'max_age'                   => 60,
            'min_business_age_months'   => 6,
            'eligible_sectors'          => null,
            'eligible_genders'          => null,
            'eligible_races'            => null,
            'requires_ssm_registration' => false,
            'requires_business_premises'=> false,
            'blacklist_check_required'  => true,
            'ccris_check_required'      => false,
            'ctos_check_required'       => false,
            'muflis_check_required'     => false,
            'esyariah_check_required'   => false,
            'required_documents'        => null,
            'is_active'                 => true,
            'color_hex'                 => '#1B2B5E',
            'display_order'             => 0,
        ];
    }
}
