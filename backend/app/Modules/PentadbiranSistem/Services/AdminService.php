<?php

namespace App\Modules\PentadbiranSistem\Services;

use App\Models\User;
use App\Modules\PentadbiranSistem\Models\SystemConfig;
use App\Modules\PentadbiranSistem\Models\Announcement;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

/**
 * Module 12 — Pentadbiran Sistem
 * Service: AdminService
 * Business logic for user management, RBAC, system config, announcements, sessions.
 */
class AdminService
{
    // ── User Management ───────────────────────────────────────────────────────

    /**
     * Get paginated user list with role info.
     */
    public function listUsers(array $filters = [], int $perPage = 20)
    {
        $query = User::with('roles')
            ->select('id', 'name', 'email', 'phone_number', 'role', 'role_label',
                     'branch', 'branch_code', 'state', 'is_active', 'is_suspended',
                     'last_login_at', 'created_at', 'password_expires_at');

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        if (!empty($filters['role'])) {
            $query->where('role', $filters['role']);
        }

        if (!empty($filters['branch'])) {
            $query->where('branch_code', $filters['branch']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', (bool) $filters['is_active']);
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Create a new user with role assignment.
     */
    public function createUser(array $data): User
    {
        $tempPassword = $data['password'] ?? Str::random(12);

        $user = User::create([
            'name'              => $data['name'],
            'email'             => $data['email'],
            'password'          => Hash::make($tempPassword),
            'phone_number'      => $data['phone_number'] ?? null,
            'role'              => $data['role'],
            'role_label'        => $data['role_label'] ?? $this->getRoleLabel($data['role']),
            'branch'            => $data['branch'] ?? null,
            'branch_code'       => $data['branch_code'] ?? null,
            'state'             => $data['state'] ?? null,
            'is_active'         => true,
            'is_suspended'      => false,
            'password_expires_at' => Carbon::now()->addDays(90),
        ]);

        // Assign Spatie role
        $spatieRole = $this->getSpatieRoleName($data['role']);
        if ($spatieRole) {
            $user->assignRole($spatieRole);
        }

        return $user->fresh(['roles']);
    }

    /**
     * Update user details and role.
     */
    public function updateUser(User $user, array $data): User
    {
        $updateData = array_filter([
            'name'         => $data['name'] ?? null,
            'email'        => $data['email'] ?? null,
            'phone_number' => $data['phone_number'] ?? null,
            'branch'       => $data['branch'] ?? null,
            'branch_code'  => $data['branch_code'] ?? null,
            'state'        => $data['state'] ?? null,
        ], fn($v) => $v !== null);

        if (!empty($data['role']) && $data['role'] !== $user->role) {
            $updateData['role'] = $data['role'];
            $updateData['role_label'] = $this->getRoleLabel($data['role']);

            // Re-assign Spatie role
            $user->syncRoles([$this->getSpatieRoleName($data['role'])]);
        }

        $user->update($updateData);
        return $user->fresh(['roles']);
    }

    /**
     * Suspend a user (blocks login).
     */
    public function suspendUser(User $user, string $reason = ''): User
    {
        $user->update([
            'is_suspended' => true,
            'is_active'    => false,
        ]);

        // Revoke all tokens
        $user->tokens()->delete();

        return $user;
    }

    /**
     * Activate a suspended user.
     */
    public function activateUser(User $user): User
    {
        $user->update([
            'is_suspended' => false,
            'is_active'    => true,
        ]);

        return $user;
    }

    /**
     * Reset user password (generates temp password).
     */
    public function resetPassword(User $user): string
    {
        $tempPassword = Str::random(12);

        $user->update([
            'password'            => Hash::make($tempPassword),
            'password_changed_at' => null,
            'password_expires_at' => Carbon::now()->addDays(1), // Force change on next login
        ]);

        // Revoke all tokens to force re-login
        $user->tokens()->delete();

        return $tempPassword;
    }

    // ── RBAC Management ───────────────────────────────────────────────────────

    /**
     * Get all roles with their permissions.
     */
    public function listRoles(): \Illuminate\Database\Eloquent\Collection
    {
        return Role::with('permissions')
            ->where('guard_name', 'sanctum')
            ->get()
            ->map(function ($role) {
                $role->permissions_list = $role->permissions->pluck('name')->toArray();
                return $role;
            });
    }

    /**
     * Get all available permissions grouped by module.
     */
    public function listPermissions(): array
    {
        $permissions = Permission::where('guard_name', 'sanctum')
            ->orderBy('name')
            ->get();

        $grouped = [];
        foreach ($permissions as $perm) {
            [$module] = explode('.', $perm->name);
            $grouped[$module][] = $perm->name;
        }

        return $grouped;
    }

    /**
     * Update permissions for a role.
     */
    public function updateRolePermissions(Role $role, array $permissions): Role
    {
        $role->syncPermissions($permissions);
        return $role->fresh(['permissions']);
    }

    // ── System Configuration ─────────────────────────────────────────────────

    /**
     * Get all system configs grouped.
     */
    public function getSystemConfigs(): array
    {
        $configs = SystemConfig::orderBy('group')->orderBy('key')->get();

        $grouped = [];
        foreach ($configs as $config) {
            $grouped[$config->group][] = [
                'id'          => $config->id,
                'key'         => $config->key,
                'value'       => $config->is_sensitive ? '••••••••' : $config->value,
                'type'        => $config->type,
                'group'       => $config->group,
                'label'       => $config->label,
                'description' => $config->description,
                'is_sensitive'=> $config->is_sensitive,
                'is_readonly' => $config->is_readonly,
            ];
        }

        return $grouped;
    }

    /**
     * Update a system config value.
     */
    public function updateConfig(string $key, string $value): SystemConfig
    {
        $config = SystemConfig::where('key', $key)->firstOrFail();

        if ($config->is_readonly) {
            throw new \Exception("Config '{$key}' is readonly.");
        }

        $config->update(['value' => $value]);
        return $config;
    }

    /**
     * Bulk update system configs.
     */
    public function bulkUpdateConfigs(array $configs): array
    {
        $updated = [];
        DB::transaction(function () use ($configs, &$updated) {
            foreach ($configs as $key => $value) {
                $config = SystemConfig::where('key', $key)->first();
                if ($config && !$config->is_readonly) {
                    $config->update(['value' => $value]);
                    $updated[] = $key;
                }
            }
        });
        return $updated;
    }

    // ── Announcements ─────────────────────────────────────────────────────────

    /**
     * List all announcements (admin view).
     */
    public function listAnnouncements(int $perPage = 20)
    {
        return Announcement::with('creator:id,name')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Get active announcements for a user role.
     */
    public function getActiveAnnouncements(string $role): \Illuminate\Database\Eloquent\Collection
    {
        return Announcement::active()
            ->where(function ($q) use ($role) {
                $q->whereNull('target_roles')
                  ->orWhereJsonContains('target_roles', $role);
            })
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Create a new announcement.
     */
    public function createAnnouncement(array $data, int $createdBy): Announcement
    {
        return Announcement::create([
            'title'        => $data['title'],
            'body'         => $data['body'],
            'type'         => $data['type'] ?? 'info',
            'target_roles' => $data['target_roles'] ?? null,
            'is_active'    => $data['is_active'] ?? true,
            'published_at' => $data['published_at'] ?? now(),
            'expires_at'   => $data['expires_at'] ?? null,
            'created_by'   => $createdBy,
        ]);
    }

    /**
     * Update an announcement.
     */
    public function updateAnnouncement(Announcement $announcement, array $data): Announcement
    {
        $announcement->update(array_filter([
            'title'        => $data['title'] ?? null,
            'body'         => $data['body'] ?? null,
            'type'         => $data['type'] ?? null,
            'target_roles' => $data['target_roles'] ?? null,
            'is_active'    => isset($data['is_active']) ? (bool) $data['is_active'] : null,
            'expires_at'   => $data['expires_at'] ?? null,
        ], fn($v) => $v !== null));

        return $announcement->fresh();
    }

    // ── Session Management ────────────────────────────────────────────────────

    /**
     * Get all active sessions (Sanctum tokens).
     */
    public function getActiveSessions(int $perPage = 50)
    {
        return DB::table('personal_access_tokens')
            ->join('users', 'users.id', '=', 'personal_access_tokens.tokenable_id')
            ->select(
                'personal_access_tokens.id',
                'personal_access_tokens.name as token_name',
                'personal_access_tokens.last_used_at',
                'personal_access_tokens.created_at',
                'personal_access_tokens.expires_at',
                'users.id as user_id',
                'users.name as user_name',
                'users.email',
                'users.role',
                'users.role_label',
                'users.branch',
            )
            ->where('personal_access_tokens.tokenable_type', 'App\\Models\\User')
            ->whereNull('personal_access_tokens.expires_at')
            ->orWhere('personal_access_tokens.expires_at', '>', now())
            ->orderBy('personal_access_tokens.last_used_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * Force logout a session (revoke token).
     */
    public function forceLogout(int $tokenId): bool
    {
        $deleted = DB::table('personal_access_tokens')->where('id', $tokenId)->delete();
        return $deleted > 0;
    }

    /**
     * Force logout all sessions for a user.
     */
    public function forceLogoutUser(int $userId): int
    {
        return DB::table('personal_access_tokens')
            ->where('tokenable_id', $userId)
            ->where('tokenable_type', 'App\\Models\\User')
            ->delete();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function getRoleLabel(string $role): string
    {
        return match ($role) {
            'branch_officer'  => 'Pegawai Cawangan',
            'branch_manager'  => 'Pengurus Cawangan',
            'credit_officer'  => 'Pegawai Kredit',
            'executive'       => 'Eksekutif',
            'system_admin'    => 'Pentadbir Sistem',
            default           => ucwords(str_replace('_', ' ', $role)),
        };
    }

    private function getSpatieRoleName(string $role): ?string
    {
        return match ($role) {
            'branch_officer' => 'Pegawai Cawangan',
            'branch_manager' => 'Pengurus Cawangan',
            'credit_officer' => 'Pegawai Kredit',
            'executive'      => 'Eksekutif',
            'system_admin'   => 'Pentadbir Sistem',
            default          => null,
        };
    }
}
