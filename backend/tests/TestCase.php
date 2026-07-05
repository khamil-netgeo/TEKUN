<?php
namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Track if module migrations have been run in this test process.
     * We use a static flag so we only run them once per test process.
     */
    private static bool $moduleMigrationsApplied = false;

    protected function setUp(): void
    {
        parent::setUp(); // This calls RefreshDatabase which runs migrate:fresh

        // After RefreshDatabase, apply module migrations if not yet done
        if (!self::$moduleMigrationsApplied) {
            $this->applyModuleMigrations();
            self::$moduleMigrationsApplied = true;
        }
    }

    /**
     * Reset the flag when the database is refreshed (new test class).
     */
    protected function refreshApplication(): void
    {
        self::$moduleMigrationsApplied = false;
        parent::refreshApplication();
    }

    private function applyModuleMigrations(): void
    {
        $modulesPath = app_path('Modules');
        if (!is_dir($modulesPath)) return;

        foreach (glob($modulesPath . '/*/Database/Migrations') as $path) {
            try {
                $this->artisan('migrate', [
                    '--path'  => str_replace(base_path() . '/', '', $path),
                    '--force' => true,
                ]);
            } catch (\Throwable $e) {
                // Ignore errors
            }
        }
    }
}
