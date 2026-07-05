<?php

namespace App\Modules\PenilaianKredit\Services;

/**
 * Module 2 — Amortization Service
 *
 * Calculates full amortization schedule for TEKUN financing.
 * Supports:
 *  - Flat rate (Murabahah — Islamic fixed profit rate)
 *  - Reducing balance (conventional reducing balance method)
 *
 * Returns full schedule table suitable for PDF export.
 */
class AmortizationService
{
    /**
     * Calculate full amortization schedule.
     *
     * @param float  $amount  Principal amount (RM)
     * @param int    $tenure  Tenure in months
     * @param float  $rate    Annual profit/interest rate (%)
     * @param string $type    'flat' | 'reducing'
     */
    public function calculate(float $amount, int $tenure, float $rate, string $type = 'flat'): array
    {
        if ($type === 'flat') {
            return $this->flatRate($amount, $tenure, $rate);
        }
        return $this->reducingBalance($amount, $tenure, $rate);
    }

    /**
     * Flat rate (Murabahah) — Islamic financing standard.
     * Total profit is fixed at origination.
     * Monthly payment = (Principal + Total Profit) / Tenure
     */
    private function flatRate(float $amount, int $tenure, float $rate): array
    {
        $totalProfit    = $amount * ($rate / 100) * ($tenure / 12);
        $totalPayable   = $amount + $totalProfit;
        $monthlyPayment = $totalPayable / $tenure;
        $monthlyProfit  = $totalProfit / $tenure;
        $monthlyPrincipal = $amount / $tenure;

        $schedule = [];
        $balance  = $amount;

        for ($i = 1; $i <= $tenure; $i++) {
            $balance = max(0, $balance - $monthlyPrincipal);
            $schedule[] = [
                'month'     => $i,
                'payment'   => round($monthlyPayment, 2),
                'principal' => round($monthlyPrincipal, 2),
                'profit'    => round($monthlyProfit, 2),
                'balance'   => round($balance, 2),
            ];
        }

        return [
            'type'            => 'flat',
            'type_label'      => 'Kadar Rata (Murabahah)',
            'amount'          => $amount,
            'tenure'          => $tenure,
            'rate'            => $rate,
            'monthly_payment' => round($monthlyPayment, 2),
            'total_payment'   => round($totalPayable, 2),
            'total_profit'    => round($totalProfit, 2),
            'effective_rate'  => round($rate * 1.8, 2), // Approximate EIR
            'schedule'        => $schedule,
        ];
    }

    /**
     * Reducing balance — conventional method.
     * Profit calculated on outstanding balance each month.
     */
    private function reducingBalance(float $amount, int $tenure, float $rate): array
    {
        $monthlyRate = $rate / 100 / 12;
        $payment     = $tenure > 0 && $monthlyRate > 0
            ? $amount * ($monthlyRate * pow(1 + $monthlyRate, $tenure)) / (pow(1 + $monthlyRate, $tenure) - 1)
            : ($tenure > 0 ? $amount / $tenure : 0);

        $schedule    = [];
        $balance     = $amount;
        $totalProfit = 0;

        for ($i = 1; $i <= $tenure; $i++) {
            $profit    = $balance * $monthlyRate;
            $principal = $payment - $profit;
            $balance   = max(0, $balance - $principal);
            $totalProfit += $profit;

            $schedule[] = [
                'month'     => $i,
                'payment'   => round($payment, 2),
                'principal' => round($principal, 2),
                'profit'    => round($profit, 2),
                'balance'   => round($balance, 2),
            ];
        }

        return [
            'type'            => 'reducing',
            'type_label'      => 'Baki Berkurangan',
            'amount'          => $amount,
            'tenure'          => $tenure,
            'rate'            => $rate,
            'monthly_payment' => round($payment, 2),
            'total_payment'   => round($payment * $tenure, 2),
            'total_profit'    => round($totalProfit, 2),
            'effective_rate'  => $rate,
            'schedule'        => $schedule,
        ];
    }

    /**
     * Compare flat vs reducing for a given set of parameters.
     * Used by the frontend toggle comparison view.
     */
    public function compare(float $amount, int $tenure, float $rate): array
    {
        $flat     = $this->flatRate($amount, $tenure, $rate);
        $reducing = $this->reducingBalance($amount, $tenure, $rate);

        return [
            'flat'     => $flat,
            'reducing' => $reducing,
            'savings'  => [
                'monthly_difference' => round($flat['monthly_payment'] - $reducing['monthly_payment'], 2),
                'total_difference'   => round($flat['total_payment'] - $reducing['total_payment'], 2),
                'recommendation'     => $flat['total_payment'] > $reducing['total_payment']
                    ? 'Baki berkurangan menjimatkan RM' . number_format($flat['total_payment'] - $reducing['total_payment'], 2) . ' keseluruhan.'
                    : 'Kadar rata lebih sesuai untuk perancangan kewangan tetap.',
            ],
        ];
    }
}
