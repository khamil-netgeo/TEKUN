<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;
use Spatie\Permission\Models\Role;
use App\Models\User;

/**
 * DemoUsersSeeder — adds missing POC demo accounts:
 *   - usahawan@tekun.gov.my  (role: usahawan / applicant)
 *   - kewangan@tekun.gov.my  (role: finance_officer)
 *
 * Run: php artisan db:seed --class=DemoUsersSeeder
 */
class DemoUsersSeeder extends Seeder
{
    public function run(): void
    {
        $guard = 'sanctum';
        $now   = Carbon::now();

        $demoUsers = [
            [
                'name'        => 'Ahmad Usahawan Bin Mohd',
                'email'       => 'usahawan@tekun.gov.my',
                'role'        => 'usahawan',
                'role_label'  => 'Usahawan',
                'branch'      => 'Cawangan Kuala Lumpur',
                'branch_code' => 'KL01',
                'state'       => 'WP Kuala Lumpur',
                'spatie_role' => null, // applicant — no Spatie role needed
                'permissions' => [
                    'modules'        => ['module1', 'module4'],
                    'actions'        => ['application.view_own', 'application.create', 'application.submit'],
                    'data_scope'     => 'own',
                    'approval_limit' => 0,
                ],
            ],
            [
                'name'        => 'Faridah Binti Zulkifli',
                'email'       => 'kewangan@tekun.gov.my',
                'role'        => 'finance_officer',
                'role_label'  => 'Pegawai Kewangan',
                'branch'      => 'Ibu Pejabat TEKUN',
                'branch_code' => 'HQ',
                'state'       => 'WP Kuala Lumpur',
                'spatie_role' => 'Pegawai Cawangan', // closest Spatie role
                'permissions' => [
                    'modules'        => ['module3', 'module4', 'module5'],
                    'actions'        => ['disbursement.process', 'payment.process', 'moratorium.process', 'tawwidh.calculate'],
                    'data_scope'     => 'national',
                    'approval_limit' => 100000,
                ],
            ],
        ];

        foreach ($demoUsers as $userData) {
            $spatieRole = $userData['spatie_role'];
            unset($userData['spatie_role']);

            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                array_merge($userData, [
                    'password'            => Hash::make('demo1234'),
                    'is_active'           => true,
                    'is_suspended'        => false,
                    'password_changed_at' => $now,
                    'password_expires_at' => $now->copy()->addDays(90),
                ])
            );

            // Assign Spatie role if applicable
            if ($spatieRole) {
                $role = Role::where('name', $spatieRole)
                            ->where('guard_name', $guard)
                            ->first();
                if ($role) {
                    $user->syncRoles([$role]);
                }
            }

            $this->command->info("✅ Seeded: {$userData['email']} (role: {$userData['role']})");
        }
    }
}
