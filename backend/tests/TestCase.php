<?php

namespace Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Artisan;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    private static bool $modulesMigrated = false;

    protected function setUp(): void
    {
        parent::setUp();
        $this->runModuleMigrationsOnce();
        $this->seedCoreRoles();
    }

    private function runModuleMigrationsOnce(): void
    {
        if (self::$modulesMigrated) {
            return;
        }

        $modulesPath = app_path('Modules');
        if (!is_dir($modulesPath)) {
            self::$modulesMigrated = true;
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

        self::$modulesMigrated = true;
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

    /**
     * Reset the static flag when the database is refreshed.
     * This ensures module migrations re-run after a migrate:fresh.
     */
    protected function refreshDatabase(): void
    {
        self::$modulesMigrated = false;
        parent::refreshDatabase();
    }
}
