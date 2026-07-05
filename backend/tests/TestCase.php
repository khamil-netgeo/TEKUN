<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp(); // RefreshDatabase runs migrate:fresh here

        // Always run module migrations after RefreshDatabase recreates the DB
        $this->runModuleMigrations();

        // Seed roles if not present
        try {
            if (\Spatie\Permission\Models\Role::count() === 0) {
                $this->artisan('db:seed', ['--class' => 'Database\\Seeders\\CoreRolesOnlySeeder']);
            }
        } catch (\Throwable $e) {
            // Ignore seeding errors
        }
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
