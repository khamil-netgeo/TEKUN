<?php

namespace Tests;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    private static bool $modulesMigrated = false;
    private static bool $rolesSeeded = false;

    protected function setUp(): void
    {
        parent::setUp();

        // Run module migrations once per test process
        if (!self::$modulesMigrated) {
            $this->runModuleMigrations();
            self::$modulesMigrated = true;
        }

        // Seed roles if not present
        try {
            if (\Spatie\Permission\Models\Role::count() === 0) {
                $this->artisan('db:seed', ['--class' => 'Database\\Seeders\\CoreRolesOnlySeeder']);
            }
        } catch (\Throwable $e) {
            // Ignore seeding errors
        }
    }

    protected function refreshApplication(): void
    {
        parent::refreshApplication();
        self::$modulesMigrated = false;
        self::$rolesSeeded = false;
    }

    private function runModuleMigrations(): void
    {
        $modulesPath = app_path('Modules');
        if (!is_dir($modulesPath)) {
            return;
        }

        foreach (glob($modulesPath . '/*/Database/Migrations') as $path) {
            try {
                $this->artisan('migrate', [
                    '--path'  => str_replace(base_path() . '/', '', $path),
                    '--force' => true,
                ]);
            } catch (\Throwable $e) {
                // Ignore errors (e.g., column already exists)
            }
        }
    }
}
