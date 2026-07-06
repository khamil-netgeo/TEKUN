<?php

namespace Database\Factories;

use App\Models\Application;
use App\Models\User;
use App\Models\Branch;
use Illuminate\Database\Eloquent\Factories\Factory;

class ApplicationFactory extends Factory
{
    protected $model = Application::class;

    public function definition(): array
    {
        $amount = $this->faker->randomFloat(2, 1000, 200000);
        return [
            'ref_no'           => 'APP-' . now()->format('Y-m') . '-' . $this->faker->unique()->numerify('#####'),
            'branch_id'        => Branch::factory(),
            'officer_id'       => User::factory(),
            'applicant_name'   => $this->faker->name(),
            'ic_no'            => $this->faker->unique()->numerify('######-##-####'),
            'phone'            => '01' . $this->faker->numerify('#########'),
            'email'            => $this->faker->unique()->safeEmail(),
            'address'          => $this->faker->address(),
            'state'            => $this->faker->randomElement(['Selangor', 'Johor', 'Perak', 'Kedah', 'Kelantan']),
            'district'         => $this->faker->city(),
            'scheme'           => $this->faker->randomElement(['TEKUN Usahawan', 'TEKUN Wanita', 'TEKUN Belia', 'TEKUN Mikro']),
            'amount_requested' => $amount,
            'amount_approved'  => $amount,
            'profit_rate'      => $this->faker->randomFloat(2, 2.0, 8.0),
            'approved_tenure'  => $this->faker->randomElement([12, 24, 36, 48, 60]),
            'tenure_months'    => 60,
            'purpose'          => 'Modal Pusingan',
            'status'           => 'approved',
        ];
    }
}