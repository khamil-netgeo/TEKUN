<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

/**
 * Seeds only roles (no users) for test environments.
 * Used by TestCase to ensure roles exist without creating conflicting demo users.
 */
class CoreRolesOnlySeeder extends Seeder
{
    public function run(): void
    {
        $guard = 'sanctum';
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $roles = [
            'Pegawai Cawangan',
            'Pengurus Cawangan',
            'Pegawai Kredit',
            'Eksekutif',
            'Pentadbir Sistem',
            // English aliases for test compatibility
            'system_admin',
            'executive',
            'branch_officer',
            'branch_manager',
            'credit_officer',
        ];

        foreach ($roles as $roleName) {
            Role::firstOrCreate(['name' => $roleName, 'guard_name' => $guard]);
        }
    }
}
