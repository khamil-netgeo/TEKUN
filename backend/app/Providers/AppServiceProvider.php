<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Bind module services
        $this->bindModuleServices();
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Load module routes dynamically
        $this->loadModuleRoutes();
    }

    /**
     * Dynamically load routes from all modules.
     */
    private function loadModuleRoutes(): void
    {
        $modulesPath = app_path('Modules');

        if (!is_dir($modulesPath)) {
            return;
        }

        foreach (glob($modulesPath . '/*/Routes/api.php') as $routeFile) {
            Route::middleware(['api'])
                ->prefix('api')
                ->group($routeFile);
        }
    }

    /**
     * Bind module service classes into the container.
     * Uses single backslash replacement to produce correct PSR-4 class names.
     */
    private function bindModuleServices(): void
    {
        $modulesPath = app_path('Modules');

        if (!is_dir($modulesPath)) {
            return;
        }

        // Auto-discover and bind services from each module
        foreach (glob($modulesPath . '/*/Services/*.php') as $serviceFile) {
            $relativePath = str_replace(app_path() . '/', '', $serviceFile);
            // Convert path separators to namespace separators (single backslash)
            $className = 'App\\' . str_replace(['/', '.php'], ['\\', ''], $relativePath);

            if (class_exists($className)) {
                $this->app->singleton($className, $className);
            }
        }
    }
}
