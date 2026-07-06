<?php

namespace Tests;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

abstract class TestCase extends BaseTestCase
{
    use DatabaseTransactions;

    private static bool $dbInitialized = false;

    protected function setUp(): void
    {
        parent::setUp();

        if (!self::$dbInitialized) {
            $this->initializeDatabase();
            self::$dbInitialized = true;
        }
    }

    private function initializeDatabase(): void
    {
        // Run core migrations
        Artisan::call('migrate', ['--force' => true]);

        // Run all module migrations
        $modulesPath = app_path('Modules');
        if (is_dir($modulesPath)) {
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

        // Seed core roles
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
