<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * TEKUN SPPT — Module Access Middleware
 * Checks if the authenticated user has access to a specific module.
 */
class CheckModuleAccess
{
    public function handle(Request $request, Closure $next, string $module): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Tidak disahkan.'], 401);
        }

        // Pentadbir Sistem (Spatie role) has access to all modules
        if ($user->hasRole('Pentadbir Sistem', 'sanctum')) {
            return $next($request);
        }

        $permissions = $user->permissions ?? [];
        $modules = $permissions['modules'] ?? [];

        // system_admin (legacy) and wildcard '*' bypass all module checks
        if ($user->role === 'system_admin' || in_array('*', $modules)) {
            return $next($request);
        }

        if (!in_array($module, $modules)) {
            return response()->json([
                'message'       => 'Akses ditolak. Anda tidak mempunyai akses ke modul ini.',
                'module'        => $module,
                'your_role'     => $user->role,
                'your_modules'  => $modules,
            ], 403);
        }

        return $next($request);
    }
}
