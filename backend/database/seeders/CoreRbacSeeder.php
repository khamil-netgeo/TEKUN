<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

/**
 * Core Foundation Seeder: CoreRbacSeeder
 *
 * Seeds 5 core roles into Spatie Laravel Permission tables:
 *   1. Pegawai Cawangan   — branch_officer
 *   2. Pengurus Cawangan  — branch_manager
 *   3. Pegawai Kredit     — credit_officer
 *   4. Eksekutif          — executive
 *   5. Pentadbir Sistem   — system_admin
 *
 * Also seeds demo user accounts and assigns Spatie roles.
 * Per project instructions Section 9.1 (RBAC — CRITICAL).
 */
class CoreRbacSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $guard = 'sanctum';

        // ── Define all granular permissions ──────────────────────────────────
        $permissions = [
            // Application (Module 1)
            'application.view_own', 'application.view_branch', 'application.view_all',
            'application.create', 'application.update', 'application.delete',
            'application.submit', 'application.approve', 'application.reject',
            'application.auto_reject', 'document.upload', 'document.delete',
            // Credit Assessment (Module 2)
            'credit.view', 'credit.assess', 'credit.approve', 'credit.reject',
            'credit.offer_letter', 'credit.amortization',
            // Disbursement (Module 3)
            'disbursement.view', 'disbursement.process', 'disbursement.approve',
            'disbursement.esign', 'disbursement.aging',
            // Account & Payment (Module 4)
            'account.view', 'account.update', 'payment.view', 'payment.process',
            'moratorium.view', 'moratorium.process', 'tawwidh.calculate', 'statement.generate',
            // NPL & Collection (Module 5)
            'npl.view', 'npl.manage', 'dunning.view', 'dunning.action', 'npl.restructure',
            // Dashboard & Reports (Module 6)
            'dashboard.view', 'report.view', 'report.generate', 'report.export',
            'analytics.view', 'analytics.drill_down',
            // CRM (Module 7)
            'entrepreneur.view', 'entrepreneur.update', 'visit.view', 'visit.create', 'visit.report',
            // Branch Management (Module 8)
            'branch.view', 'branch.manage', 'branch.performance', 'branch.staff',
            // Product (Module 9)
            'product.view', 'product.manage', 'product.eligibility',
            // Integration (Module 10)
            'integration.view', 'integration.check', 'integration.manage',
            // Audit (Module 11)
            'audit.view', 'audit.export', 'audit.anomalies',
            // Admin (Module 12)
            'user.view', 'user.create', 'user.update', 'user.delete',
            'user.suspend', 'user.activate', 'user.reset_password',
            'role.view', 'role.manage', 'system.configure',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => $guard]);
        }

        $this->command->info('✅ ' . count($permissions) . ' permissions seeded.');

        // ── Create 5 Core Roles ───────────────────────────────────────────────

        // Role 1: Pegawai Cawangan
        $pegawaiCawangan = Role::firstOrCreate(['name' => 'Pegawai Cawangan', 'guard_name' => $guard]);
        $pegawaiCawangan->syncPermissions([
            'application.view_branch', 'application.create', 'application.update',
            'application.submit', 'document.upload', 'document.delete',
            'credit.view', 'account.view', 'payment.view', 'statement.generate',
            'npl.view', 'dunning.view', 'entrepreneur.view', 'visit.create', 'visit.view',
            'dashboard.view', 'report.view',
        ]);

        // Role 2: Pengurus Cawangan
        $pengurusCawangan = Role::firstOrCreate(['name' => 'Pengurus Cawangan', 'guard_name' => $guard]);
        $pengurusCawangan->syncPermissions([
            'application.view_branch', 'application.create', 'application.update',
            'application.approve', 'application.reject', 'application.submit',
            'document.upload', 'document.delete',
            'credit.view', 'credit.assess', 'credit.approve', 'credit.reject', 'credit.offer_letter',
            'disbursement.view', 'disbursement.approve',
            'account.view', 'account.update', 'payment.view', 'payment.process',
            'moratorium.view', 'moratorium.process', 'tawwidh.calculate', 'statement.generate',
            'npl.view', 'npl.manage', 'dunning.view', 'dunning.action',
            'entrepreneur.view', 'entrepreneur.update', 'visit.view', 'visit.create', 'visit.report',
            'branch.view', 'branch.performance', 'branch.staff',
            'dashboard.view', 'report.view', 'report.generate', 'report.export',
        ]);

        // Role 3: Pegawai Kredit
        $pegawaiKredit = Role::firstOrCreate(['name' => 'Pegawai Kredit', 'guard_name' => $guard]);
        $pegawaiKredit->syncPermissions([
            'application.view_all', 'application.approve', 'application.reject',
            'credit.view', 'credit.assess', 'credit.approve', 'credit.reject',
            'credit.offer_letter', 'credit.amortization',
            'disbursement.view', 'disbursement.process', 'disbursement.approve',
            'disbursement.esign', 'disbursement.aging',
            'account.view', 'payment.view', 'npl.view', 'npl.manage',
            'dunning.view', 'dunning.action', 'npl.restructure',
            'dashboard.view', 'report.view', 'report.generate', 'analytics.view',
        ]);

        // Role 4: Eksekutif
        $eksekutif = Role::firstOrCreate(['name' => 'Eksekutif', 'guard_name' => $guard]);
        $eksekutif->syncPermissions([
            'application.view_all', 'credit.view', 'disbursement.view',
            'account.view', 'payment.view', 'npl.view',
            'dashboard.view', 'report.view', 'report.generate', 'report.export',
            'analytics.view', 'analytics.drill_down',
            'entrepreneur.view', 'branch.view', 'branch.performance',
            'product.view', 'integration.view', 'audit.view',
        ]);

        // Role 5: Pentadbir Sistem
        $pentadbirSistem = Role::firstOrCreate(['name' => 'Pentadbir Sistem', 'guard_name' => $guard]);
        $pentadbirSistem->syncPermissions(Permission::where('guard_name', $guard)->pluck('name')->toArray());

        $this->command->info('✅ 5 core roles seeded with permissions.');

        // ── Seed Demo Users and Assign Spatie Roles ───────────────────────────
        $now = Carbon::now();

        $demoUsers = [
            [
                'name'        => 'Ahmad Faizal Bin Mohd Noor',
                'email'       => 'pegawai@tekun.gov.my',
                'role'        => 'branch_officer',
                'role_label'  => 'Pegawai Cawangan',
                'branch'      => 'Cawangan Kuala Lumpur',
                'branch_code' => 'KL01',
                'state'       => 'WP Kuala Lumpur',
                'spatie_role' => 'Pegawai Cawangan',
                'permissions' => [
                    'modules'        => ['module1', 'module2', 'module4', 'module5', 'module7'],
                    'actions'        => ['application.view_branch', 'application.create', 'credit.view'],
                    'data_scope'     => 'branch',
                    'approval_limit' => 0,
                ],
            ],
            [
                'name'        => 'Nor Azlina Binti Hassan',
                'email'       => 'pengurus@tekun.gov.my',
                'role'        => 'branch_manager',
                'role_label'  => 'Pengurus Cawangan',
                'branch'      => 'Cawangan Kuala Lumpur',
                'branch_code' => 'KL01',
                'state'       => 'WP Kuala Lumpur',
                'spatie_role' => 'Pengurus Cawangan',
                'permissions' => [
                    'modules'        => ['module1', 'module2', 'module3', 'module4', 'module5', 'module7', 'module8'],
                    'actions'        => ['application.approve', 'credit.approve', 'disbursement.approve'],
                    'data_scope'     => 'branch',
                    'approval_limit' => 50000,
                ],
            ],
            [
                'name'        => 'Mohd Hafiz Bin Zainudin',
                'email'       => 'kredit@tekun.gov.my',
                'role'        => 'credit_officer',
                'role_label'  => 'Pegawai Kredit',
                'branch'      => 'Ibu Pejabat TEKUN',
                'branch_code' => 'HQ',
                'state'       => 'WP Kuala Lumpur',
                'spatie_role' => 'Pegawai Kredit',
                'permissions' => [
                    'modules'        => ['module1', 'module2', 'module3', 'module4', 'module5'],
                    'actions'        => ['credit.assess', 'credit.approve', 'disbursement.process'],
                    'data_scope'     => 'national',
                    'approval_limit' => 200000,
                ],
            ],
            [
                'name'        => 'Dato Sri Razali Bin Ahmad',
                'email'       => 'eksekutif@tekun.gov.my',
                'role'        => 'executive',
                'role_label'  => 'Eksekutif',
                'branch'      => 'Ibu Pejabat TEKUN',
                'branch_code' => 'HQ',
                'state'       => 'WP Kuala Lumpur',
                'spatie_role' => 'Eksekutif',
                'permissions' => [
                    'modules'        => ['module6', 'module7', 'module8', 'module9', 'module10'],
                    'actions'        => ['dashboard.view', 'report.view', 'analytics.view'],
                    'data_scope'     => 'national',
                    'approval_limit' => 999999,
                ],
            ],
            [
                'name'        => 'Siti Aminah Binti Kamarudin',
                'email'       => 'admin@tekun.gov.my',
                'role'        => 'system_admin',
                'role_label'  => 'Pentadbir Sistem',
                'branch'      => 'Ibu Pejabat TEKUN',
                'branch_code' => 'HQ',
                'state'       => 'WP Kuala Lumpur',
                'spatie_role' => 'Pentadbir Sistem',
                'permissions' => [
                    'modules'        => ['*'],
                    'actions'        => ['*'],
                    'data_scope'     => 'national',
                    'approval_limit' => 999999,
                ],
            ],
        ];

        foreach ($demoUsers as $userData) {
            $spatieRole = $userData['spatie_role'];
            unset($userData['spatie_role']);

            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                array_merge($userData, [
                    'password'            => Hash::make('Demo@TEKUN2026!'),
                    'is_active'           => true,
                    'is_suspended'        => false,
                    'password_changed_at' => $now,
                    'password_expires_at' => $now->copy()->addDays(90),
                ])
            );

            // Assign Spatie role
            $role = Role::where('name', $spatieRole)->where('guard_name', $guard)->first();
            if ($role) {
                $user->syncRoles([$role]);
            }
        }

        $this->command->info('✅ 5 demo users seeded with Spatie roles assigned.');
        $this->command->table(
            ['Role', 'Email', 'Spatie Role'],
            collect($demoUsers)->map(fn($u) => [
                $u['role_label'], $u['email'],
                Role::where('name', $u['role_label'] ?? '')->first()?->name ?? 'N/A',
            ])->toArray()
        );
    }
}
