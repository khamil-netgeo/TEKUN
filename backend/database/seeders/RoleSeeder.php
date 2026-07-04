<?php
namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * TEKUN SPPT — Role Seeder
 * Based on Tender Document: TEKUN/SPPT/2026/TENDER
 *
 * 7 Roles defined in tender:
 * 1. usahawan         — Pemohon/Usahawan (entrepreneur portal)
 * 2. branch_officer   — Pegawai Pembiayaan Cawangan (branch financing officer)
 * 3. branch_manager   — Pengurus Cawangan (branch manager, approves up to RM10k)
 * 4. credit_officer   — Penganalisis Kredit / Pegawai Penilai (HQ credit analyst)
 * 5. finance_officer  — Pegawai Kewangan (disbursement & financial processing)
 * 6. executive        — Pengurusan Atasan / Eksekutif (top management, read-only analytics)
 * 7. system_admin     — Pentadbir Sistem (full system access)
 *
 * Approval Authority Matrix (from tender):
 * - Below RM 10,000 : Pengurus Cawangan (branch_manager)
 * - RM 10,001–50,000: Pengurus Cawangan + Pegawai Ibu Pejabat (credit_officer)
 * - Above RM 50,000 : Lembaga Kredit / Jawatankuasa Pembiayaan (executive)
 */
class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            // ─────────────────────────────────────────────────────────────────
            // 1. USAHAWAN — Entrepreneur self-service portal
            // Access: Module 1 (apply), Module 4 (view own account), Module 5 (pay)
            // ─────────────────────────────────────────────────────────────────
            [
                'name'        => 'Ahmad Bin Mohd Noor',
                'email'       => 'usahawan@tekun.gov.my',
                'password'    => Hash::make('demo1234'),
                'role'        => 'usahawan',
                'role_label'  => 'Usahawan',
                'branch'      => null,
                'branch_code' => null,
                'state'       => 'Selangor',
                'permissions' => [
                    'modules'  => ['module1', 'module4', 'module5'],
                    'actions'  => [
                        'application.create',
                        'application.view_own',
                        'account.view_own',
                        'payment.make',
                        'statement.download_own',
                    ],
                    'data_scope' => 'own',
                    'approval_limit' => 0,
                ],
            ],

            // ─────────────────────────────────────────────────────────────────
            // 2. BRANCH OFFICER — Pegawai Pembiayaan Cawangan
            // Access: Module 1 (process), Module 2 (pre-assess), Module 7 (CRM)
            // Tender: "Pegawai Pembiayaan Cawangan → Pengurus Cawangan → Jawatankuasa"
            // ─────────────────────────────────────────────────────────────────
            [
                'name'        => 'Ahmad Fadzillah Bin Razak',
                'email'       => 'pegawai@tekun.gov.my',
                'password'    => Hash::make('demo1234'),
                'role'        => 'branch_officer',
                'role_label'  => 'Pegawai Pembiayaan Cawangan',
                'branch'      => 'Cawangan Kuala Lumpur',
                'branch_code' => 'KL01',
                'state'       => 'WP Kuala Lumpur',
                'permissions' => [
                    'modules'  => ['module1', 'module2', 'module7'],
                    'actions'  => [
                        'application.view',
                        'application.process',
                        'application.pre_assess',
                        'document.verify',
                        'entrepreneur.view',
                        'field_visit.create',
                        'field_visit.view',
                    ],
                    'data_scope' => 'branch',
                    'approval_limit' => 0,
                ],
            ],

            // ─────────────────────────────────────────────────────────────────
            // 3. BRANCH MANAGER — Pengurus Cawangan
            // Access: Module 1, 2, 3 (limited), 7, 8
            // Tender: Approves financing up to RM 10,000
            // ─────────────────────────────────────────────────────────────────
            [
                'name'        => 'Noraini Binti Hassan',
                'email'       => 'pengurus@tekun.gov.my',
                'password'    => Hash::make('demo1234'),
                'role'        => 'branch_manager',
                'role_label'  => 'Pengurus Cawangan',
                'branch'      => 'Cawangan Kuala Lumpur',
                'branch_code' => 'KL01',
                'state'       => 'WP Kuala Lumpur',
                'permissions' => [
                    'modules'  => ['module1', 'module2', 'module3', 'module7', 'module8'],
                    'actions'  => [
                        'application.view',
                        'application.approve',
                        'application.reject',
                        'application.return_query',
                        'credit.view_score',
                        'disbursement.view',
                        'esign.view',
                        'entrepreneur.view',
                        'field_visit.view',
                        'branch.view_own',
                    ],
                    'data_scope' => 'branch',
                    'approval_limit' => 10000,
                ],
            ],

            // ─────────────────────────────────────────────────────────────────
            // 4. CREDIT OFFICER — Penganalisis Kredit / Pegawai Penilai HQ
            // Access: Module 2 (full), Module 3 (view), Module 5 (NPL), Module 8
            // Tender: "Credit Analyst → Branch Manager → Financing Committee"
            // ─────────────────────────────────────────────────────────────────
            [
                'name'        => 'Mohd Hafizi Bin Ismail',
                'email'       => 'kredit@tekun.gov.my',
                'password'    => Hash::make('demo1234'),
                'role'        => 'credit_officer',
                'role_label'  => 'Penganalisis Kredit',
                'branch'      => 'Ibu Pejabat TEKUN',
                'branch_code' => 'HQ',
                'state'       => 'WP Kuala Lumpur',
                'permissions' => [
                    'modules'  => ['module2', 'module3', 'module5', 'module6'],
                    'actions'  => [
                        'application.view',
                        'credit.score',
                        'credit.view_ccris',
                        'credit.view_ctos',
                        'credit.approve_recommendation',
                        'disbursement.view',
                        'esign.view',
                        'aging.view',
                        'npl.view',
                        'dunning.generate',
                        'report.view',
                    ],
                    'data_scope' => 'national',
                    'approval_limit' => 50000,
                ],
            ],

            // ─────────────────────────────────────────────────────────────────
            // 5. FINANCE OFFICER — Pegawai Kewangan
            // Access: Module 3 (full disbursement), Module 4 (accounts), Module 5
            // Tender: "batch fund disbursement processing by Finance Officers"
            // ─────────────────────────────────────────────────────────────────
            [
                'name'        => 'Siti Hajar Binti Yusof',
                'email'       => 'kewangan@tekun.gov.my',
                'password'    => Hash::make('demo1234'),
                'role'        => 'finance_officer',
                'role_label'  => 'Pegawai Kewangan',
                'branch'      => 'Ibu Pejabat TEKUN',
                'branch_code' => 'HQ',
                'state'       => 'WP Kuala Lumpur',
                'permissions' => [
                    'modules'  => ['module3', 'module4', 'module5'],
                    'actions'  => [
                        'disbursement.view',
                        'disbursement.process_batch',
                        'disbursement.generate_payment_file',
                        'esign.view',
                        'esign.track',
                        'aging.view',
                        'aging.escalate',
                        'account.view',
                        'account.update',
                        'payment.view',
                        'tawidh.calculate',
                        'moratorium.process',
                        'statement.generate',
                    ],
                    'data_scope' => 'national',
                    'approval_limit' => 0,
                ],
            ],

            // ─────────────────────────────────────────────────────────────────
            // 6. EXECUTIVE — Pengurusan Atasan / Eksekutif
            // Access: Module 6 (analytics), Module 8 (reports) — READ ONLY
            // Tender: "Top Management can view nationwide data" (Power BI RLS)
            // ─────────────────────────────────────────────────────────────────
            [
                'name'        => 'Dato Sri Razali Bin Ahmad',
                'email'       => 'eksekutif@tekun.gov.my',
                'password'    => Hash::make('demo1234'),
                'role'        => 'executive',
                'role_label'  => 'Pengurusan Atasan',
                'branch'      => 'Ibu Pejabat TEKUN',
                'branch_code' => 'HQ',
                'state'       => 'WP Kuala Lumpur',
                'permissions' => [
                    'modules'  => ['module6'],
                    'actions'  => [
                        'dashboard.view',
                        'report.view',
                        'report.export',
                        'analytics.view',
                        'analytics.drill_down',
                    ],
                    'data_scope' => 'national',
                    'approval_limit' => 999999,
                ],
            ],

            // ─────────────────────────────────────────────────────────────────
            // 7. SYSTEM ADMIN — Pentadbir Sistem
            // Access: ALL modules — full CRUD
            // Tender: "User Management, System Configuration, Basic Monitoring"
            // ─────────────────────────────────────────────────────────────────
            [
                'name'        => 'Siti Aminah Binti Kamarudin',
                'email'       => 'admin@tekun.gov.my',
                'password'    => Hash::make('demo1234'),
                'role'        => 'system_admin',
                'role_label'  => 'Pentadbir Sistem',
                'branch'      => 'Ibu Pejabat TEKUN',
                'branch_code' => 'HQ',
                'state'       => 'WP Kuala Lumpur',
                'permissions' => [
                    'modules'  => ['*'],
                    'actions'  => ['*'],
                    'data_scope' => 'national',
                    'approval_limit' => 999999,
                ],
            ],
        ];

        foreach ($roles as $roleData) {
            User::updateOrCreate(
                ['email' => $roleData['email']],
                $roleData
            );
        }

        $this->command->info('✅ 7 TEKUN SPPT roles seeded successfully.');
        $this->command->table(
            ['Role', 'Email', 'Modules'],
            collect($roles)->map(fn($r) => [
                $r['role_label'],
                $r['email'],
                is_array($r['permissions']['modules'])
                    ? implode(', ', $r['permissions']['modules'])
                    : '*',
            ])->toArray()
        );
    }
}
