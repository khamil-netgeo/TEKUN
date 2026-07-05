<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * TEKUN SPPT — Role-Based Access Control Middleware
 * Enforces tender-defined role permissions on API routes.
 *
 * Usage in routes:
 *   Route::middleware(['auth:sanctum', 'role:system_admin,executive'])->group(...)
 *   Route::middleware(['auth:sanctum', 'module:module3'])->group(...)
 */
class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Tidak disahkan.'], 401);
        }

        // system_admin bypasses all role checks (column-based)
        if ($user->role === 'system_admin') {
            return $next($request);
        }

        // Pentadbir Sistem / system_admin Spatie role bypasses all role checks
        if (method_exists($user, 'hasRole')) {
            if ($user->hasRole('system_admin') || $user->hasRole('Pentadbir Sistem')) {
                return $next($request);
            }
        }

        // Check column-based role
        if (in_array($user->role, $roles)) {
            return $next($request);
        }

        // Check Spatie roles
        if (method_exists($user, 'hasRole')) {
            foreach ($roles as $role) {
                if ($user->hasRole($role)) {
                    return $next($request);
                }
            }
        }

        return response()->json([
            'message'   => 'Akses ditolak. Peranan anda tidak mempunyai kebenaran untuk tindakan ini.',
            'your_role' => $user->role,
            'required'  => $roles,
        ], 403);
    }
}
