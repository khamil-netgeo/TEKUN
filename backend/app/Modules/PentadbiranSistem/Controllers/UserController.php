<?php

namespace App\Modules\PentadbiranSistem\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AuditTrail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

/**
 * Module 12 — Pentadbiran Sistem
 * Controller: UserController
 *
 * Fixes applied (per Orchestrator audit 2026-07-04):
 *  - index()    : real DB query with Spatie roles, search & filter, pagination
 *  - store()    : creates user in DB + assigns Spatie role via assignRole()
 *  - update()   : updates user + syncs roles via syncRoles()
 *  - suspend()  : sets is_suspended = true in DB + logs to audit_trails
 *  - activate() : sets is_suspended = false, is_active = true + logs audit
 *  - stats()    : counts from real DB (users, active, suspended, by-role)
 *  - roles()    : returns all Spatie roles with permission counts
 *  - resetPassword() : generates temp password, hashes and stores in DB
 */
class UserController extends Controller
{
    // ══════════════════════════════════════════════════════════════════════════
    // USER LIST
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * GET /api/users
     * Paginated user list with Spatie roles, search & filter support.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->get('per_page', 15), 100);
        $search  = $request->get('search', '');
        $role    = $request->get('role', '');
        $status  = $request->get('status', '');

        $query = User::with('roles')
            ->select([
                'id', 'name', 'email', 'phone_number',
                'branch', 'branch_code', 'state',
                'is_active', 'is_suspended',
                'last_login_at', 'created_at', 'updated_at',
            ]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role) {
            $query->whereHas('roles', fn($q) => $q->where('name', $role));
        }

        if ($status === 'active') {
            $query->where('is_active', true)->where('is_suspended', false);
        } elseif ($status === 'suspended') {
            $query->where('is_suspended', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        }

        $paginated = $query->orderBy('created_at', 'desc')->paginate($perPage);

        $items = collect($paginated->items())->map(function (User $user) {
            return [
                'id'           => $user->id,
                'name'         => $user->name,
                'email'        => $user->email,
                'phone_number' => $user->phone_number,
                'branch'       => $user->branch,
                'branch_code'  => $user->branch_code,
                'state'        => $user->state,
                'role'         => $user->roles->first()?->name ?? null,
                'role_label'   => $user->roles->first()?->name ?? 'Tiada Peranan',
                'is_active'    => $user->is_active ?? true,
                'is_suspended' => $user->is_suspended ?? false,
                'status'       => $this->resolveStatus($user),
                'last_login_at' => $user->last_login_at?->toIso8601String(),
                'created_at'   => $user->created_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $items,
            'meta'    => [
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
            ],
        ]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SINGLE USER
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * GET /api/users/{id}
     */
    public function show(int $id): JsonResponse
    {
        $user = User::with('roles', 'permissions')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => [
                'id'           => $user->id,
                'name'         => $user->name,
                'email'        => $user->email,
                'phone_number' => $user->phone_number,
                'branch'       => $user->branch,
                'branch_code'  => $user->branch_code,
                'state'        => $user->state,
                'role'         => $user->roles->first()?->name ?? null,
                'is_active'    => $user->is_active ?? true,
                'is_suspended' => $user->is_suspended ?? false,
                'status'       => $this->resolveStatus($user),
                'last_login_at' => $user->last_login_at?->toIso8601String(),
                'created_at'   => $user->created_at?->toIso8601String(),
            ],
        ]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CREATE USER
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * POST /api/users
     * Creates a new user in the DB and assigns a Spatie role via assignRole().
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'         => 'required|string|max:255',
            'email'        => 'required|email|unique:users,email',
            'password'     => 'required|string|min:12',
            'role'         => 'required|string|exists:roles,name',
            'phone_number' => 'nullable|string|max:20',
            'branch'       => 'nullable|string|max:100',
            'branch_code'  => 'nullable|string|max:20',
            'state'        => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => __('messages.validation_failed'),
                'errors'  => $validator->errors(),
            ], 422);
        }

        $user = User::create([
            'name'                => $request->name,
            'email'               => $request->email,
            'password'            => Hash::make($request->password),
            'phone_number'        => $request->phone_number,
            'branch'              => $request->branch,
            'branch_code'         => $request->branch_code,
            'state'               => $request->state,
            'is_active'           => true,
            'is_suspended'        => false,
            'password_changed_at' => now(),
            'password_expires_at' => now()->addDays(90),
        ]);

        // Assign Spatie role
        $user->assignRole($request->role);

        $this->logAudit('created', $user, [], $user->toArray(), "Pengguna baharu dicipta: {$user->email}");

        return response()->json([
            'success' => true,
            'message' => __('messages.user_created'),
            'data'    => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $request->role,
            ],
        ], 201);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // UPDATE USER
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * PUT /api/users/{id}
     * Updates user details and syncs Spatie role via syncRoles().
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name'         => 'sometimes|required|string|max:255',
            'email'        => "sometimes|required|email|unique:users,email,{$id}",
            'role'         => 'sometimes|required|string|exists:roles,name',
            'phone_number' => 'nullable|string|max:20',
            'branch'       => 'nullable|string|max:100',
            'branch_code'  => 'nullable|string|max:20',
            'state'        => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => __('messages.validation_failed'),
                'errors'  => $validator->errors(),
            ], 422);
        }

        $before = $user->toArray();

        $user->fill($request->only([
            'name', 'email', 'phone_number', 'branch', 'branch_code', 'state',
        ]));
        $user->save();

        // Sync Spatie role if provided
        if ($request->has('role')) {
            $user->syncRoles([$request->role]);
        }

        $this->logAudit('updated', $user, $before, $user->fresh()->toArray(), "Pengguna dikemaskini: {$user->email}");

        return response()->json([
            'success' => true,
            'message' => __('messages.user_updated'),
            'data'    => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->roles->first()?->name,
            ],
        ]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SUSPEND USER
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * POST /api/users/{id}/suspend
     * Sets is_suspended = true in DB and logs to audit_trails.
     */
    public function suspend(int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if (Auth::id() === $user->id) {
            return response()->json([
                'success' => false,
                'message' => __('messages.cannot_suspend_self'),
            ], 422);
        }

        $before = ['is_suspended' => $user->is_suspended, 'is_active' => $user->is_active];

        $user->is_suspended = true;
        $user->save();

        // Revoke all Sanctum tokens (force logout)
        $user->tokens()->delete();

        $this->logAudit('update', $user, $before, ['is_suspended' => true], "Akaun pengguna digantung: {$user->email}");

        return response()->json([
            'success' => true,
            'message' => __('messages.user_suspended', ['name' => $user->name]),
            'data'    => ['id' => $user->id, 'is_suspended' => true],
        ]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ACTIVATE USER
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * POST /api/users/{id}/activate
     * Sets is_suspended = false and is_active = true in DB, logs audit.
     */
    public function activate(int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $before = ['is_suspended' => $user->is_suspended, 'is_active' => $user->is_active];

        $user->is_suspended = false;
        $user->is_active    = true;
        $user->save();

        $this->logAudit('update', $user, $before, ['is_suspended' => false, 'is_active' => true], "Akaun pengguna diaktifkan semula: {$user->email}");

        return response()->json([
            'success' => true,
            'message' => __('messages.user_activated', ['name' => $user->name]),
            'data'    => ['id' => $user->id, 'is_active' => true, 'is_suspended' => false],
        ]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // RESET PASSWORD
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * POST /api/users/{id}/reset-password
     * Generates a temporary password, stores hashed in DB, returns plaintext to admin.
     */
    public function resetPassword(int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $tempPassword = Str::password(16, true, true, true, false);

        $user->password            = Hash::make($tempPassword);
        $user->password_changed_at = null;
        $user->password_expires_at = now()->addDays(1);
        $user->save();

        $user->tokens()->delete();

        $this->logAudit('update', $user, [], [], "Kata laluan ditetapkan semula untuk: {$user->email}");

        return response()->json([
            'success'       => true,
            'message'       => __('messages.password_reset_temp', ['name' => $user->name]),
            'temp_password' => $tempPassword,
            'note'          => __('messages.password_reset_note'),
        ]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // STATS
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * GET /api/users/stats
     * Returns real counts from the users table and Spatie roles.
     */
    public function stats(): JsonResponse
    {
        $total     = User::count();
        $active    = User::where('is_active', true)->where('is_suspended', false)->count();
        $suspended = User::where('is_suspended', true)->count();
        $inactive  = User::where('is_active', false)->count();

        $roles = Role::get()->map(function ($r) {
            try {
                $count = \App\Models\User::role($r->name)->count();
            } catch (\Throwable $e) {
                $count = 0;
            }
            return ['role' => $r->name, 'count' => $count];
        });

        $newThisMonth = User::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'total'          => $total,
                'active'         => $active,
                'suspended'      => $suspended,
                'inactive'       => $inactive,
                'new_this_month' => $newThisMonth,
                'by_role'        => $roles,
            ],
        ]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ROLES
    // ══════════════════════════════════════════════════════════════════════════

    /**
     * GET /api/roles
     * Returns all Spatie roles with their permissions and user counts.
     */
    public function roles(): JsonResponse
    {
        $roles = Role::with('permissions')
            ->withCount('permissions') // Add permissions_count
            ->get()
            ->map(function ($role) {
                try {
                    $usersCount = \App\Models\User::role($role->name)->count();
                } catch (\Throwable $e) {
                    $usersCount = 0;
                }
                
                return [
                    'id'              => $role->id,
                    'name'            => $role->name,
                    'permissions'     => $role->permissions->pluck('name'),
                    'permissions_count' => $role->permissions_count, // Use the counted value
                    'users_count'     => $usersCount,
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => $roles,
        ]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // HELPER METHODS
    // ══════════════════════════════════════════════════════════════════════════

    private function resolveStatus(User $user): string
    {
        if ($user->is_suspended) {
            return 'Digantung';
        }
        return $user->is_active ? 'Aktif' : 'Tidak Aktif';
    }

    private function logAudit(string $action, User $user, array $before, array $after, string $details): void
    {
        AuditTrail::create([
                'auditable_type' => \App\Models\User::class,
                'auditable_id'   => Auth::id() ?? 0,
            'user_id'     => Auth::id() ?? 1,
            'module'      => 'Pentadbiran Sistem - Pengguna',
            'action'      => $action,
            'target_id'   => $user->id,
            'target_type' => User::class,
            'old_values'  => empty($before) ? null : json_encode($before),
            'new_values'  => empty($after) ? null : json_encode($after),
            'ip_address'  => request()->ip(),
            'user_agent'  => request()->userAgent(),
            'details'     => $details,
        ]);
    }
}