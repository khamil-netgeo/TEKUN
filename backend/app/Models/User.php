<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

/**
 * Core Foundation Model: User
 * Includes Spatie HasRoles for RBAC, Sanctum for API tokens,
 * and password policy fields (expiry, active/suspended status).
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'name', 'email', 'password',
        'phone_number',
        'role', 'role_label',
        'branch', 'branch_code', 'state',
        'permissions',
        'is_active', 'is_suspended',
        'password_changed_at', 'password_expires_at',
        'last_login_at', 'last_login_ip',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at'   => 'datetime',
        'password'            => 'hashed',
        'permissions'         => 'array',
        'is_active'           => 'boolean',
        'is_suspended'        => 'boolean',
        'password_changed_at' => 'datetime',
        'password_expires_at' => 'datetime',
        'last_login_at'       => 'datetime',
    ];

    // Guard name for Spatie (Sanctum uses 'sanctum' guard)
    protected string $guard_name = 'sanctum';

    // ── Helpers ──────────────────────────────────────────────────────────────

    public function isPasswordExpired(): bool
    {
        return $this->password_expires_at && $this->password_expires_at->isPast();
    }

    public function isAccessible(): bool
    {
        return ($this->is_active ?? true) && !($this->is_suspended ?? false);
    }

    public function hasModuleAccess(string $module): bool
    {
        if ($this->role === 'system_admin') return true;
        $modules = $this->permissions['modules'] ?? [];
        return in_array('*', $modules) || in_array($module, $modules);
    }

    public function canApprove(float $amount): bool
    {
        $limit = $this->permissions['approval_limit'] ?? 0;
        return $limit >= $amount;
    }
}
