<?php

namespace Tests;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

abstract class TestCase extends BaseTestCase
{
    use DatabaseTransactions;

    /**
     * Track whether module migrations have been run in this process.
     * Static so it persists across all test classes in one run.
     */
    private static bool $moduleMigrationsRun = false;

    /**
     * Run before each test. We run module migrations before the transaction
     * wraps the test, so they persist across tests.
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->ensureModuleMigrations();
    }

    /**
     * Run module migrations once per test process, outside of any transaction.
     * This ensures tables exist for all tests.
     */
    private function ensureModuleMigrations(): void
    {
        if (self::$moduleMigrationsRun) {
            return;
        }

        // Commit any open transaction first
        try {
            DB::commit();
        } catch (\Throwable $e) {
            // No open transaction
        }

        $modulesPath = app_path('Modules');
        if (!is_dir($modulesPath)) {
            self::$moduleMigrationsRun = true;
            return;
        }

        foreach (glob($modulesPath . '/*/Database/Migrations') as $path) {
            try {
                Artisan::call('migrate', [
                    '--path'  => str_replace(base_path() . '/', '', $path),
                    '--force' => true,
                ]);
            } catch (\Throwable $e) {
                // Ignore errors (table already exists, etc.)
            }
        }

        // Seed core roles if not present
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

        self::$moduleMigrationsRun = true;
    }
}
