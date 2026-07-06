<?php

namespace Database\Factories;

use App\Models\Disbursement;
use App\Models\Application;
use Illuminate\Database\Eloquent\Factories\Factory;

class DisbursementFactory extends Factory
{
    protected $model = Disbursement::class;

    public function definition(): array
    {
        $amount = $this->faker->randomFloat(2, 1000, 200000);

        return [
            'application_id'    => Application::factory(),
            'ref_no'            => 'DIS-' . now()->format('Y-m') . '-' . $this->faker->unique()->numerify('#####'),
            'amount'            => $amount,
            'bank_name'         => $this->faker->randomElement(['Maybank Islamic', 'CIMB Islamic', 'Bank Islam Malaysia', 'RHB Islamic']),
            'bank_account_no'   => $this->faker->numerify('##########'),
            'bank_account_name' => $this->faker->name(),
            'bank_verified'     => true,
            'status'            => 'pending',
            'approval_level'    => Disbursement::determineAuthority($amount),
            'esign_status'      => 'pending',
            'is_batch'          => false,
            'aging_days'        => 0,
            'is_escalated'      => false,
            'ai_anomaly_flag'   => false,
            'twofa_required'    => true,
            'twofa_confirmed'   => false,
            'esign_reminder_sent' => false,
            'esign_ai_anomaly'  => false,
            'sla_breach'        => false,
            'notify_sent'       => false,
        ];
    }
}