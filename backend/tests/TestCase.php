<?php

namespace Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Artisan;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    /**
     * Called by the RefreshDatabase trait after every migrate:fresh.
     * This is the correct hook to run module migrations.
     */
    protected function afterRefreshingDatabase(): void
    {
        $this->runModuleMigrations();
        $this->seedCoreRoles();
    }

    private function runModuleMigrations(): void
    {
        $modulesPath = app_path('Modules');
        if (!is_dir($modulesPath)) {
            return;
        }

        foreach (glob($modulesPath . '/*/Database/Migrations') as $path) {
            try {
                Artisan::call('migrate', [
                    '--path'  => str_replace(base_path() . '/', '', $path),
                    '--force' => true,
                ]);
            } catch (\Throwable $e) {
                // Ignore already-exists errors
            }
        }
    }

    private function seedCoreRoles(): void
    {
        try {
            if (\Spatie\Permission\Models\Role::count() === 0) {
                Artisan::call('db:seed', [
                    '--class' => 'Database\\Seeders\\CoreRolesOnlySeeder',
                    '--force' => true,
                ]);
            }
        } catch (\Throwable $e) {
            // Ignore
        }
    }
}
