<?php

namespace Database\Factories;

use App\Modules\ProdukPembiayaan\Models\FinancingProduct;
use Illuminate\Database\Eloquent\Factories\Factory;

class FinancingProductFactory extends Factory
{
    protected $model = FinancingProduct::class;

    public function definition(): array
    {
        return [
            'code'                      => 'SKM-' . str_pad($this->faker->unique()->numberBetween(1, 999), 3, '0', STR_PAD_LEFT),
            'name'                      => $this->faker->words(3, true),
            'name_en'                   => $this->faker->words(3, true),
            'description'               => $this->faker->sentence(),
            'description_en'            => $this->faker->sentence(),
            'min_amount'                => 1000.00,
            'max_amount'                => 50000.00,
            'profit_rate'               => 4.00,
            'min_tenure_months'         => 6,
            'max_tenure_months'         => 36,
            'min_age'                   => 18,
            'max_age'                   => 60,
            'eligible_genders'          => json_encode(['M', 'F']),
            'blacklist_check_required'  => true,
            'is_active'                 => true,
            'color_hex'                 => '#1B2B5E',
            'display_order'             => 0,
        ];
    }
}
