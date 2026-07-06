<?php

namespace App\Modules\PengeluaranDana\Services;

class DisbursementService
{
    /**
     * Return the full authority matrix.
     */
    public static function authorityMatrix(): array
    {
        return [
            [
                'level'     => 'branch',
                'label'     => 'Cawangan',
                'min'       => 0,
                'max'       => 10000,
                'roles'     => ['pegawai_cawangan', 'pengurus_cawangan'],
                'approvers' => ['Pengurus Cawangan'],
            ],
            [
                'level'     => 'state',
                'label'     => 'Negeri',
                'min'       => 10001,
                'max'       => 50000,
                'roles'     => ['pengurus_negeri', 'pegawai_kredit'],
                'approvers' => ['Pengurus Negeri', 'Pegawai Kredit Kanan'],
            ],
            [
                'level'     => 'hq',
                'label'     => 'Ibu Pejabat',
                'min'       => 50001,
                'max'       => 200000,
                'roles'     => ['eksekutif', 'pentadbir_sistem'],
                'approvers' => ['Pengurus Besar', 'Timbalan Pengurus Besar'],
            ],
            [
                'level'     => 'board',
                'label'     => 'Lembaga Pengarah',
                'min'       => 200001,
                'max'       => PHP_INT_MAX,
                'roles'     => ['pentadbir_sistem'],
                'approvers' => ['Lembaga Pengarah TEKUN'],
            ],
        ];
    }

    /**
     * Determine the required approval level for a given amount.
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
}
