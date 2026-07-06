<?php

namespace Database\Factories;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Factories\Factory;

class BranchFactory extends Factory
{
    protected $model = Branch::class;

    public function definition(): array
    {
        return [
            'code'     => $this->faker->unique()->bothify('B###'),
            'name'     => 'Cawangan ' . $this->faker->city(),
            'state'    => $this->faker->randomElement(['Selangor', 'Johor', 'Perak', 'Kedah', 'Kelantan']),
            'district' => $this->faker->city(),
        ];
    }
}