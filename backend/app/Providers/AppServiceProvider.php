<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\File;

/**
 * TEKUN SPPT - AppServiceProvider
 * Implements DYNAMIC MODULE ROUTE LOADING per project instructions Section 3.1.
 * Each module defines its own Routes/api.php under app/Modules/<ModuleName>/Routes/.
 * This auto-discovers and loads ALL module routes without modifying routes/api.php.
 */
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->loadModuleRoutes();
    }

    protected function loadModuleRoutes(): void
    {
        $modulesPath = app_path('Modules');

        if (!File::isDirectory($modulesPath)) {
            return;
        }

        $moduleDirs = File::directories($modulesPath);

        foreach ($moduleDirs as $moduleDir) {
            $routeFile = $moduleDir . '/Routes/api.php';

            if (File::exists($routeFile)) {
                Route::middleware('api')
                    ->prefix('api')
                    ->group($routeFile);
            }
        }
    }
}
