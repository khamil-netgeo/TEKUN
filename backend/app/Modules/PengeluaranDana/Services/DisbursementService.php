<?php

namespace App\Modules\PengeluaranDana\Services;

/**
 * DisbursementService — Module 3 (Pengeluaran Dana)
 *
 * Authority matrix levels MUST match App\Models\Disbursement::determineAuthority():
 *   branch_officer   → ≤ 10,000
 *   branch_manager   → 10,001 – 30,000
 *   credit_committee → 30,001 – 100,000
 *   executive        → > 100,000
 */
class DisbursementService
{
    /**
     * Return the full authority matrix (4 tiers).
     * Level names align with Disbursement::determineAuthority().
     */
    public static function authorityMatrix(): array
    {
        return [
            [
                'level'     => 'branch_officer',
                'label'     => 'Pegawai Cawangan',
                'min'       => 0,
                'max'       => 10000,
                'roles'     => ['branch_officer', 'branch_manager'],
                'approvers' => ['Pegawai Cawangan', 'Pengurus Cawangan'],
            ],
            [
                'level'     => 'branch_manager',
                'label'     => 'Pengurus Cawangan',
                'min'       => 10001,
                'max'       => 30000,
                'roles'     => ['branch_manager', 'credit_officer'],
                'approvers' => ['Pengurus Cawangan', 'Pegawai Kredit'],
            ],
            [
                'level'     => 'credit_committee',
                'label'     => 'Jawatankuasa Kredit',
                'min'       => 30001,
                'max'       => 100000,
                'roles'     => ['credit_officer', 'executive'],
                'approvers' => ['Pegawai Kredit Kanan', 'Eksekutif'],
            ],
            [
                'level'     => 'executive',
                'label'     => 'Lembaga Pengarah',
                'min'       => 100001,
                'max'       => PHP_INT_MAX,
                'roles'     => ['executive', 'system_admin'],
                'approvers' => ['Eksekutif', 'Lembaga Pengarah TEKUN'],
            ],
        ];
    }

    /**
     * Determine the required approval tier for a given amount.
     */
    public static function requiredApprovalLevel(float $amount, array $matrix): array
    {
        foreach ($matrix as $tier) {
            if ($amount >= $tier['min'] && $amount <= $tier['max']) {
                return $tier;
            }
        }
        return end($matrix);
    }

    /**
     * Roles that are allowed to approve any amount (superusers).
     */
    public static function superApproverRoles(): array
    {
        return ['system_admin', 'executive'];
    }
}
