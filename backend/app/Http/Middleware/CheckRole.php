<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * TEKUN SPPT — Role-Based Access Control Middleware
 * Checks both the users.role column (legacy) and Spatie roles.
 */
class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Tidak disahkan.'], 401);
        }

        // Reload user with roles to ensure fresh data (avoid cache issues in tests)
        $user->load('roles');

        // system_admin (legacy column) bypasses all role checks
        if ($user->role === 'system_admin') {
            return $next($request);
        }

        // Pentadbir Sistem (Spatie role) bypasses all role checks
        if ($user->hasRole('Pentadbir Sistem', 'sanctum')) {
            return $next($request);
        }

        // Check legacy role column
        if (in_array($user->role, $roles)) {
            return $next($request);
        }

        // Check Spatie roles with explicit sanctum guard
        foreach ($roles as $role) {
            if ($user->hasRole($role, 'sanctum')) {
                return $next($request);
            }
        }

        return response()->json([
            'message'   => 'Akses ditolak. Peranan anda tidak mempunyai kebenaran untuk tindakan ini.',
            'your_role' => $user->role,
            'required'  => $roles,
        ], 403);
    }
}
