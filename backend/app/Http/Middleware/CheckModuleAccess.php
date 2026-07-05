<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * TEKUN SPPT — Module Access Middleware
 * Checks if the authenticated user has access to a specific module.
 *
 * Usage: Route::middleware(['auth:sanctum', 'module:module3'])->group(...)
 */
class CheckModuleAccess
{
    public function handle(Request $request, Closure $next, string $module): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Tidak disahkan.'], 401);
        }

        $permissions = $user->permissions ?? [];
        $modules = $permissions['modules'] ?? [];

        // system_admin and wildcard '*' bypass all module checks
        if ($user->role === 'system_admin' || in_array('*', $modules)) {
            return $next($request);
        }
        // Also check Spatie roles for system_admin bypass
        if ($user->hasRole('system_admin') || $user->hasRole('Pentadbir Sistem')) {
            return $next($request);
        }

        // Role-based module access map (column-based roles)
        $roleModuleMap = [
            'branch_officer'  => ['module1', 'module2', 'module3', 'module4', 'module5', 'module7', 'module9'],
            'branch_manager'  => ['module1', 'module2', 'module3', 'module4', 'module5', 'module7', 'module8', 'module9'],
            'credit_officer'  => ['module1', 'module2', 'module3', 'module4', 'module5', 'module9'],
            'executive'       => ['module1', 'module2', 'module3', 'module4', 'module5', 'module6', 'module7', 'module8', 'module9', 'module10', 'module11'],
            'finance_officer' => ['module4', 'module5', 'module9'],
        ];
        $roleModules = $roleModuleMap[$user->role] ?? [];
        if (in_array($module, $roleModules)) {
            return $next($request);
        }

        // Also check Spatie role-based access
        $spatieRoleModuleMap = [
            'Pegawai Cawangan'  => ['module1', 'module2', 'module3', 'module4', 'module5', 'module7', 'module9'],
            'Pengurus Cawangan' => ['module1', 'module2', 'module3', 'module4', 'module5', 'module7', 'module8', 'module9'],
            'Pegawai Kredit'    => ['module1', 'module2', 'module3', 'module4', 'module5', 'module9'],
            'Eksekutif'         => ['module1', 'module2', 'module3', 'module4', 'module5', 'module6', 'module7', 'module8', 'module9', 'module10', 'module11'],
        ];
        foreach ($spatieRoleModuleMap as $roleName => $allowedModules) {
            if ($user->hasRole($roleName) && in_array($module, $allowedModules)) {
                return $next($request);
            }
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
// Note: Security headers added via bootstrap/app.php
