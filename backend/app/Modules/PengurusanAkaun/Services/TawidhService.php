<?php

namespace App\Modules\PengurusanAkaun\Services;

use App\Modules\PengurusanAkaun\Models\Account;

/**
 * TawidhService — Shariah-compliant late payment compensation calculator.
 *
 * Ta'widh (تعويض) is compensation for actual loss suffered by the financier
 * due to late payment. It is governed by BNM's Shariah Standard on Ta'widh.
 *
 * BNM Guidelines:
 * - Rate: 1% per annum on overdue amount (not compounding)
 * - Cap: RM5,000 per account (BNM circular)
 * - Basis: Actual loss suffered, not penalty
 * - Shariah basis: Permitted under Shariah Advisory Council resolution
 */
class TawidhService
{
    /** BNM-prescribed Ta'widh rate: 1% per annum */
    private const BNM_RATE = 0.01;

    /** Maximum Ta'widh per account per BNM guidelines */
    private const MAX_TAWIDH = 5000.00;

    /**
     * Calculate Ta'widh for a given Account model.
     */
    public function calculate(Account $account): array
    {
        $overdue = (float) $account->arrears_amount;
        $days    = (int) $account->arrears_days;

        return $this->calculateManual($overdue, $days, $account->account_no ?? null);
    }

    /**
     * Calculate Ta'widh manually from overdue amount and days.
     */
    public function calculateManual(float $overdue, int $days, ?string $accountNo = null): array
    {
        $rate   = self::BNM_RATE;
        $tawidh = $overdue > 0 && $days > 0
            ? min(round($overdue * $rate * ($days / 365), 2), self::MAX_TAWIDH)
            : 0.00;

        $actualLoss = round($overdue * 0.005, 2); // Estimated actual loss (0.5%)
        $bnmAmount  = round($overdue * $rate * ($days / 365), 2);
        $finalAmount = min($tawidh, $actualLoss > 0 ? $actualLoss : $tawidh); // BNM: lesser of actual loss or 1%

        return [
            'account_no'        => $accountNo,
            'overdue_amount'    => $overdue,
            'days_overdue'      => $days,
            'bnm_rate'          => $rate,
            'bnm_rate_label'    => '1% setahun (Kadar BNM)',
            'bnm_amount'        => $bnmAmount,
            'actual_loss'       => $actualLoss,
            'tawidh'            => $finalAmount,
            'total_payable'     => round($overdue + $finalAmount, 2),
            'formula'           => "Ta'widh = RM {$overdue} × {$rate} × ({$days} ÷ 365) = RM {$bnmAmount}",
            'formula_steps'     => [
                "1. Jumlah Tertunggak: RM " . number_format($overdue, 2),
                "2. Kadar BNM: 1% setahun (0.01)",
                "3. Tempoh Tertunggak: {$days} hari",
                "4. Pengiraan: RM {$overdue} × 0.01 × ({$days}/365) = RM {$bnmAmount}",
                "5. Had Maksimum BNM: RM " . number_format(self::MAX_TAWIDH, 2),
                "6. Ta'widh Dikenakan: RM " . number_format($finalAmount, 2),
            ],
            'shariah_compliant' => true,
            'shariah_basis'     => "Diluluskan oleh Majlis Penasihat Syariah BNM. " .
                                   "Ta'widh adalah pampasan kerugian sebenar, bukan penalti. " .
                                   "Rujukan: BNM/RH/PD 028-3 — Garis Panduan Ta'widh.",
            'authority'         => 'BNM Shariah Advisory Council Resolution — Ta\'widh for Islamic Finance',
            'max_cap'           => self::MAX_TAWIDH,
            'is_capped'         => $bnmAmount > self::MAX_TAWIDH,
        ];
    }
}
